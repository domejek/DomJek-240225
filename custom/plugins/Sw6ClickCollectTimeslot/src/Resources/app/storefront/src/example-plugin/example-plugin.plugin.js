import Plugin from 'src/plugin-system/plugin.class';

export default class ExamplePlugin extends Plugin {
    init() {
        this.container = this.el || document.querySelector('[data-click-collect]');
        this.confirmBtn = this.container?.querySelector('[data-click-collect-confirm]');
        this.notice = this.container?.querySelector('[data-click-collect-notice]');

        this.onConfirm = this.onConfirm.bind(this);
        this.confirmBtn?.addEventListener('click', this.onConfirm);
        
        // Hide panel by default; only show when the special shipping method is selected
        if (this.container) {
            this.container.style.display = 'none';
        }

        // Try to move panel to the shipping method area on checkout confirm
        this.tryMoveToShippingPosition();

        // Watch for shipping method selection changes
        this.observeShippingSelection();
    }

    onConfirm() {
        const selected = this.container.querySelector('input[name="sw_timeslot"]:checked');
        if (!selected) {
            this.showNotice('Bitte wählen Sie ein Zeitfenster aus.');
            return;
        }
        const value = selected.value;
        window.localStorage.setItem('sw_click_collect_timeslot', value);
        this.showNotice('Zeitfenster gewählt: ' + selected.nextSibling.textContent.trim());
        document.dispatchEvent(new CustomEvent('sw.clickCollect.timeslotSelected', { detail: { timeslot: value } }));
    }

    showNotice(msg) {
        if (this.notice) this.notice.textContent = msg;
        else alert(msg);
    }

    tryMoveToShippingPosition() {
        const tryFindAndMove = () => {
            try {
                if (!window.location.pathname.includes('/checkout/confirm')) return false;

                const container = this.container || document.querySelector('[data-click-collect]');
                if (!container) return false;

                const candidates = [
                    '[data-shipping-method]',
                    '.checkout-confirm-shipping',
                    '.confirm-shipping',
                    '.shipping-method',
                    '.delivery-information',
                    '.checkout-shipping',
                    '.checkout-aside',
                ];

                let target = null;
                for (const sel of candidates) {
                    const el = document.querySelector(sel);
                    if (el) { target = el; break; }
                }

                if (!target) {
                    const nodes = Array.from(document.querySelectorAll('h1,h2,h3,h4,legend,label,dt,div'));
                    const found = nodes.find(n => /Versandart|Shipping method|Versand/i.test(n.textContent));
                    if (found) target = found.parentElement || found;
                }

                if (target) {
                    target.insertAdjacentElement('afterend', container);
                    return true;
                }
            } catch (e) {
                // ignore
            }

            return false;
        };

        // If shipping block may be rendered asynchronously, observe the DOM until it appears
        const moved = tryFindAndMove();
        if (moved) return;

        const observer = new MutationObserver((mutations, obs) => {
            if (tryFindAndMove()) {
                obs.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
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
        const match = /abholung im store|abholung/i.test(normalized);

        if (match && this.container) {
            this.container.style.display = '';
        } else if (this.container) {
            this.container.style.display = 'none';
        }
    }

    destroy() {
        this.confirmBtn?.removeEventListener('click', this.onConfirm);
    }
}