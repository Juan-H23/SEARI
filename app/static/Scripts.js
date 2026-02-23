// Scripts.js - Funcionalidad para SEARI

// Variables del modal
let registroAEliminar = null;

// Mostrar modal de confirmación
function mostrarModal(id) {
    registroAEliminar = id;
    document.getElementById('modal-delete').style.display = 'flex';
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('modal-delete').style.display = 'none';
    registroAEliminar = null;
}

// Confirmar eliminación
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('cancel-delete');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (registroAEliminar) {
                // Crear formulario dinámico para eliminar
                const form = document.createElement('form');
                form.method = 'post';
                form.action = `/delete/${registroAEliminar}`;
                document.body.appendChild(form);
                form.submit();
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cerrarModal);
    }
    
    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarModal();
        }
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-delete');
        if (e.target === modal) {
            cerrarModal();
        }
    });
});

// Validación de formularios
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        const valorInput = this.querySelector('input[name="valor"]');
        if (valorInput) {
            const valor = parseFloat(valorInput.value);
            if (isNaN(valor) || valor < 0) {
                e.preventDefault();
                alert('Por favor, ingresa un valor válido (mayor o igual a 0)');
            }
        }
    });
});

// Formato de números en tiempo real
document.querySelectorAll('input[name="valor"]').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.value) {
            const valor = parseFloat(this.value);
            if (!isNaN(valor)) {
                this.value = valor.toFixed(2);
            }
        }
    });
});

// Mensaje de bienvenida en consola
console.log('🔷 SEARI - Sistema de Registros cargado correctamente');