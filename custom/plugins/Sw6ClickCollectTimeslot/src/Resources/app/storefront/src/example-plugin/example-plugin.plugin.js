import Plugin from 'src/plugin-system/plugin.class';

export default class ExamplePlugin extends Plugin {
    init() {
        this.container = this.el || document.querySelector('[data-click-collect]');
        this.notice = this.container?.querySelector('[data-click-collect-notice]');
        this.isClickCollectSelected = false;

        // Watch for shipping method selection changes
        this.observeShippingSelection();
        
        // Handle timeslot submission
        this.handleTimeslotSaving();

        // Handle checkout validation
        this.handleCheckoutValidation();
    }

    observeShippingSelection() {
        const NAME = 'shippingMethod';
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

        // Check if this is Click & Collect by value or label
        const isClickCollectByValue = input.value === 'click-collect';
        
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
        const matchByLabel = /abholung im store|abholung|click.*collect|click and collect/i.test(normalized);
        const match = isClickCollectByValue || matchByLabel;

        // Get all standard shipping methods (excluding click & collect)
        const standardShippingMethods = document.querySelectorAll('.shipping-method');

        if (match && timeslotContainer) {
            timeslotContainer.style.display = '';
            // Reset the timeslot selection when switching to this method
            const radioInputs = timeslotContainer.querySelectorAll('input[name="sw_timeslot"]');
            radioInputs.forEach(radio => radio.checked = false);
            // Hide standard shipping methods when Click & Collect is selected
            standardShippingMethods.forEach(method => {
                method.style.display = 'none';
            });
            this.isClickCollectSelected = true;
        } else if (timeslotContainer) {
            timeslotContainer.style.display = 'none';
            // Show standard shipping methods when Click & Collect is not selected
            standardShippingMethods.forEach(method => {
                method.style.display = '';
            });
            this.isClickCollectSelected = false;
        }
    }

    handleTimeslotSaving() {
        // Save timeslot selection when form is submitted
        const form = this.el?.closest('form') || document.querySelector('#changeShippingForm');
        if (form) {
            const originalSubmit = form.onsubmit;
            form.addEventListener('submit', (e) => {
                if (this.isClickCollectSelected) {
                    const selected = this.container?.querySelector('input[name="sw_timeslot"]:checked');
                    if (selected) {
                        window.localStorage.setItem('sw_click_collect_timeslot', selected.value);
                        this.setCookie('sw_click_collect_timeslot', selected.value, 1);
                        this.setCookie('sw_click_collect_is_pickup', '1', 1);
                        document.dispatchEvent(new CustomEvent('sw.clickCollect.timeslotSelected', { 
                            detail: { timeslot: selected.value } 
                        }));
                    }
                }
            });
        }

        // Also handle auto-save on shipping method change
        this.container?.addEventListener('change', (e) => {
            if (e.target.name === 'sw_timeslot' && e.target.checked) {
                window.localStorage.setItem('sw_click_collect_timeslot', e.target.value);
                this.setCookie('sw_click_collect_timeslot', e.target.value, 1);
                this.setCookie('sw_click_collect_is_pickup', '1', 1);
            }
        });
    }

    handleCheckoutValidation() {
        const errorMessage = window.accessibilityText?.clickCollectTimeslot?.error || 'Bitte wählen Sie ein Zeitfenster aus';
        
        // Find the checkout form (confirm order form)
        const checkoutForm = document.querySelector('form[name="confirmOrderForm"]') || 
                            document.querySelector('#confirmOrderForm') ||
                            document.querySelector('form[action*="checkout/confirm"]');
        
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                // Check if Click & Collect is selected
                if (this.isClickCollectSelected) {
                    const selectedTimeslot = this.container?.querySelector('input[name="sw_timeslot"]:checked');
                    if (!selectedTimeslot) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.showError(errorMessage);
                        return false;
                    }
                    
                    // Add hidden inputs to the form for the backend
                    this.addHiddenInputToForm(checkoutForm, 'sw_timeslot', selectedTimeslot.value);
                    this.addHiddenInputToForm(checkoutForm, 'sw_click_collect_is_pickup', '1');
                    
                    // Also save to cookie for the subscriber
                    this.setCookie('sw_click_collect_timeslot', selectedTimeslot.value, 1);
                }
            });
        }

        // Also watch for the confirm button click
        const confirmButton = document.querySelector('.btn.checkout-confirm-submit') ||
                             document.querySelector('button[type="submit"][form="confirmOrderForm"]') ||
                             document.querySelector('.checkout-confirm-form-submit');
        
        if (confirmButton) {
            confirmButton.addEventListener('click', (e) => {
                // Check if Click & Collect is selected
                if (this.isClickCollectSelected) {
                    const selectedTimeslot = this.container?.querySelector('input[name="sw_timeslot"]:checked');
                    if (!selectedTimeslot) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.showError(errorMessage);
                        return false;
                    }
                    
                    // Find the form and add hidden inputs
                    const form = document.querySelector('form[name="confirmOrderForm"]') || 
                                document.querySelector('#confirmOrderForm') ||
                                document.querySelector('form[action*="checkout/confirm"]');
                    if (form) {
                        this.addHiddenInputToForm(form, 'sw_timeslot', selectedTimeslot.value);
                        this.addHiddenInputToForm(form, 'sw_click_collect_is_pickup', '1');
                    }
                    
                    // Also save to cookie for the subscriber
                    this.setCookie('sw_click_collect_timeslot', selectedTimeslot.value, 1);
                }
            });
        }
    }

    showError(message) {
        // Remove existing error message
        const existingError = document.querySelector('.click-collect-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger click-collect-error';
        errorDiv.style.marginTop = '10px';
        errorDiv.innerHTML = `<div class="alert-content">${message}</div>`;

        // Insert after the timeslot container
        if (this.container) {
            this.container.appendChild(errorDiv);
            
            // Scroll to error
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    }

    getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    addHiddenInputToForm(form, name, value) {
        // Remove existing hidden input with same name
        const existingInput = form.querySelector(`input[type="hidden"][name="${name}"]`);
        if (existingInput) {
            existingInput.remove();
        }
        
        // Create new hidden input
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = name;
        hiddenInput.value = value;
        form.appendChild(hiddenInput);
    }

    destroy() {
        // Cleanup listeners
    }
}
