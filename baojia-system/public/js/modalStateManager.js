if (typeof ModalStateManager === 'undefined') {
  var ModalStateManager = {
    STORAGE_KEY: 'app_modal_states',

    saveAllModalStates() {
      const activeModals = [];

      document.querySelectorAll('.modal.show').forEach(modalEl => {
        const modalId = modalEl.id;
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) {
          const state = {
            modalId: modalId,
            page: window.location.pathname
          };

          const formInModal = modalEl.querySelector('form');
          if (formInModal) {
            state.formData = this.serializeForm(formInModal);
          }

          if (modalId === 'customerModal' && typeof currentCustomerId !== 'undefined') {
            state.customerId = currentCustomerId;
          }

          if (modalId === 'attachmentModal' && typeof currentAttachmentCustomerId !== 'undefined') {
            state.customerId = currentAttachmentCustomerId;
            state.customerName = document.getElementById('attachmentCustomerName')?.textContent;
          }

          activeModals.push(state);
        }
      });

      if (activeModals.length > 0) {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeModals));
      }
    },

    serializeForm(form) {
      const data = {};
      const formData = new FormData(form);
      for (let [key, value] of formData.entries()) {
        if (!data[key]) {
          data[key] = value;
        }
      }
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.type !== 'submit' && input.type !== 'button') {
          if (input.type === 'checkbox') {
            data[input.name || input.id] = input.checked;
          } else if (input.type === 'radio') {
            if (input.checked) {
              data[input.name || input.id] = input.value;
            }
          } else {
            data[input.name || input.id] = input.value;
          }
        }
      });
      return data;
    },

    restoreAllModalStates() {
      const savedStates = sessionStorage.getItem(this.STORAGE_KEY);
      if (!savedStates) return;

      const activeModals = JSON.parse(savedStates);
      if (!Array.isArray(activeModals) || activeModals.length === 0) return;

      activeModals.forEach(state => {
        const modalEl = document.getElementById(state.modalId);
        if (modalEl) {
          if (state.formData) {
            this.fillForm(modalEl, state.formData);
          }

          if (state.modalId === 'customerModal' && state.customerId) {
            window.currentCustomerId = state.customerId;
          }

          if (state.modalId === 'attachmentModal' && state.customerId) {
            window.currentAttachmentCustomerId = state.customerId;
          }

          const bsModal = new bootstrap.Modal(modalEl, {
            backdrop: 'static',
            keyboard: false
          });
          bsModal.show();
        }
      });

      sessionStorage.removeItem(this.STORAGE_KEY);
    },

    fillForm(modalEl, formData) {
      Object.keys(formData).forEach(key => {
        const input = modalEl.querySelector(`[name="${key}"]`) || modalEl.querySelector(`#${key}`);
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = formData[key];
          } else {
            input.value = formData[key];
          }
        }
      });
    },

    clearAllModalStates() {
      sessionStorage.removeItem(this.STORAGE_KEY);
    },

    init() {
      window.addEventListener('beforeunload', () => {
        this.saveAllModalStates();
      });

      document.addEventListener('DOMContentLoaded', () => {
        this.restoreAllModalStates();

        document.querySelectorAll('.modal').forEach(modalEl => {
          modalEl.addEventListener('hidden.bs.modal', () => {
            this.clearAllModalStates();
          });
        });
      });
    }
  };

  ModalStateManager.init();
}