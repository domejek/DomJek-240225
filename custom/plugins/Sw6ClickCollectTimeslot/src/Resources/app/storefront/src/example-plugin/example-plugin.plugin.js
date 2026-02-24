import Plugin from 'src/plugin-system/plugin.class';

export default class ExamplePlugin extends Plugin {
    init() {
        this.container = this.el || document.querySelector('[data-click-collect]');
        this.notice = this.container?.querySelector('[data-click-collect-notice]');

        // Watch for shipping method selection changes
        this.observeShippingSelection();
        
        // Handle timeslot submission
        this.handleTimeslotSaving();
    }

    observeShippingSelection() {
        const NAME = 'shippingMethodId';
        const checkAndBind = () => {
            const inputs = Array.from(document.querySelectorAll(`input[name="${NAME}"]`));
            if (!inputs.length) return false;

            // Bind change listener
            inputs.forEach((i) => i.removeEventListener('change', this._shippingHandler));
            this._shippingHandler = this._shippingHandler || this.onShippingChange.bind(this);
            inputs.forEach((i) => i.addEventListener('change', this._shippingHandler));

            // Initial check
            const checked = inputs.find(i => i.checked);
            if (checked) this.onShippingChange({ target: checked });

            return true;
        };

        if (checkAndBind()) return;

        const obs = new MutationObserver(() => {
            if (checkAndBind()) {
                obs.disconnect();
            }
        });

        obs.observe(document.body, { childList: true, subtree: true });
    }

    onShippingChange(e) {
        const input = e.target || e;
        if (!input) return;

        // Find the timeslot container relative to the shipping method
        let timeslotContainer = input.closest('.shipping-method')?.querySelector('[data-click-collect]');
        
        if (!timeslotContainer) {
            // Fallback: search in the entire shipping methods section
            const shippingForm = document.querySelector('[data-form-auto-submit]') || input.closest('form');
            if (shippingForm) {
                timeslotContainer = shippingForm.querySelector('[data-click-collect]');
            }
        }

        if (!timeslotContainer) {
            timeslotContainer = this.container;
        }

        if (!timeslotContainer) return;

        // Determine label text for this input
        let labelText = '';
        try {
            if (input.id) {
                const lab = document.querySelector(`label[for="${input.id}"]`);
                if (lab) labelText = lab.textContent || '';
            }

            if (!labelText) {
                const parentLabel = input.closest('label');
                if (parentLabel) labelText = parentLabel.textContent || '';
            }
        } catch (err) {
            labelText = '';
        }

        const normalized = (labelText || '').trim().toLowerCase();
        const match = /abholung im store|abholung|click.*collect|click and collect/i.test(normalized);

        if (match && timeslotContainer) {
            timeslotContainer.style.display = '';
            // Reset the timeslot selection when switching to this method
            const radioInputs = timeslotContainer.querySelectorAll('input[name="sw_timeslot"]');
            radioInputs.forEach(radio => radio.checked = false);
        } else if (timeslotContainer) {
            timeslotContainer.style.display = 'none';
        }
    }

    handleTimeslotSaving() {
        // Save timeslot selection when form is submitted
        const form = this.el?.closest('form') || document.querySelector('#changeShippingForm');
        if (form) {
            const originalSubmit = form.onsubmit;
            form.addEventListener('submit', (e) => {
                const selected = this.container?.querySelector('input[name="sw_timeslot"]:checked');
                if (selected) {
                    window.localStorage.setItem('sw_click_collect_timeslot', selected.value);
                    document.dispatchEvent(new CustomEvent('sw.clickCollect.timeslotSelected', { 
                        detail: { timeslot: selected.value } 
                    }));
                }
            });
        }

        // Also handle auto-save on shipping method change
        this.container?.addEventListener('change', (e) => {
            if (e.target.name === 'sw_timeslot' && e.target.checked) {
                window.localStorage.setItem('sw_click_collect_timeslot', e.target.value);
            }
        });
    }

    destroy() {
        // Cleanup listeners
    }
}
