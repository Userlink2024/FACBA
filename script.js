const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Reemplaza con tu API Key de Firebase
    authDomain: "lazapateria-ce24f.firebaseapp.com",
    projectId: "lazapateria-ce24f",
    storageBucket: "lazapateria-ce24f.firebasestorage.app",
    messagingSenderId: "642571845821",
    appId: "1:642571845821:web:45858a0abc0df728fd77d4",
    measurementId: "G-6JCF33H0K1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const inventoryCollection = db.collection('inventario');
const salesCollection = db.collection('ventas');

document.addEventListener('DOMContentLoaded', () => {
    const inventoryProviderInput = document.getElementById('inventory-provider');
    const inventoryReferenceInput = document.getElementById('inventory-reference');
    const inventoryColorInput = document.getElementById('inventory-color');
    const inventoryMetersInput = document.getElementById('inventory-meters');
    const inventoryCentimetersInput = document.getElementById('inventory-centimeters');
    const addInventoryItemButton = document.getElementById('add-inventory-item');
    const currentInventoryListDiv = document.getElementById('current-inventory-list');
    const exportInventoryExcelButton = document.getElementById('export-inventory-excel');

    const billingClientInput = document.getElementById('billing-client');
    const billingProductSearchInput = document.getElementById('billing-product-search');
    const billingMetersInput = document.getElementById('billing-meters');
    const billingCentimetersInput = document.getElementById('billing-centimeters');
    const addToBillButton = document.getElementById('add-to-bill');
    const billingItemsListDiv = document.getElementById('billing-items-list');
    const finalizeBillingButton = document.getElementById('finalize-billing');
    const exportBillingExcelButton = document.getElementById('export-billing-excel');
    const searchResultsDiv = document.getElementById('search-results');

    let inventoryData = [];
    let currentBillItems = [];

    // --- Funciones de Exportación a Excel ---
    function exportToExcel(data, filename) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([new Uint8Array(wbout)], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename + '.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    exportInventoryExcelButton.addEventListener('click', async () => {
        const snapshot = await inventoryCollection.get();
        const inventoryExportData = snapshot.docs.map(doc => doc.data());
        exportToExcel(inventoryExportData, 'inventario');
    });

    exportBillingExcelButton.addEventListener('click', async () => {
        const snapshot = await salesCollection.get();
        const billingExportData = snapshot.docs.map(doc => ({
            FechaHora: doc.data().fechaHora,
            Cliente: doc.data().cliente,
            Items: doc.data().items.map(item => {
                let details = `${item.referencia} - <span class="math-inline">\{item\.color\} \(</span>{item.unidad})`;
                if (item.cantidad) details += `: ${item.cantidad} unidades`;
                if (item.metros !== undefined && item.centimetros !== undefined) details += `: ${item.metros} m ${item.centimetros} cm`;
                return details;
            }).join(', ')
        }));
        exportToExcel(billingExportData, 'facturas');
    });

    // --- Funcionalidad para Agregar al Inventario ---
    addInventoryItemButton.addEventListener('click', async () => {
        const proveedor = inventoryProviderInput.value.trim();
        const referencia = inventoryReferenceInput.value.trim();
        const color = inventoryColorInput.value.trim();
        let unidad = '';
        let metros = 0;
        let centimetros = 0;

        if (document.getElementById('inventory-unit-unidades').checked) {
            unidad = 'unidades';
        } else if (document.getElementById('inventory-unit-metros').checked) {
            unidad = 'metros';
            metros = parseInt(inventoryMetersInput.value) || 0;
            centimetros = parseInt(inventoryCentimetersInput.value) || 0;
        }

        if (proveedor && referencia && color && unidad) {
            const newItem = {
                proveedor: proveedor,
                referencia: referencia,
                color: color,
                unidad: unidad,
                metros: unidad === 'metros' ? metros : null,
                centimetros: unidad === 'metros' ? centimetros : null
            };

            try {
                await inventoryCollection.add(newItem);
                alert('Producto agregado al inventario.');
                inventoryProviderInput.value = '';
                inventoryReferenceInput.value = '';
                inventoryColorInput.value = '';
                document.getElementById('inventory-unit-unidades').checked = false;
                document.getElementById('inventory-unit-metros').checked = false;
                inventoryMetersInput.value = '0';
                inventoryCentimetersInput.value = '0';
                document.getElementById('inventory-meters-group').style.display = 'none';
                document.getElementById('inventory-centimeters-group').style.display = 'none';
                fetchInventory();
            } catch (error) {
                console.error("Error al agregar al inventario: ", error);
            }
        } else {
            alert('Por favor, complete todos los campos del inventario.');
        }
    });

    // --- Mostrar el Inventario Actual ---
    const fetchInventory = async () => {currentInventoryListDiv.innerHTML = '<p>Cargando inventario...</p>';
        try {
            const snapshot = await inventoryCollection.get();
            inventoryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderInventoryList(inventoryData);
        } catch (error) {
            console.error("Error al obtener el inventario: ", error);
            currentInventoryListDiv.innerHTML = '<p>Error al cargar el inventario.</p>';
        }
    };

    const renderInventoryList = (inventory) => {
        currentInventoryListDiv.innerHTML = '';
        if (inventory.length === 0) {
            currentInventoryListDiv.innerHTML = '<p>No hay productos en el inventario.</p>';
            return;
        }
        const ul = document.createElement('ul');
        inventory.forEach(item => {
            const li = document.createElement('li');
            let details = `${item.proveedor} - Ref: ${item.referencia} - Color: ${item.color} (${item.unidad})`;
            if (item.unidad === 'metros') {
                details += `: ${item.metros} m ${item.centimetros} cm`;
            }
            li.textContent = details;
            ul.appendChild(li);
        });
        currentInventoryListDiv.appendChild(ul);
    };

    fetchInventory();

    // --- Funcionalidad de Búsqueda de Productos para Facturación ---
    billingProductSearchInput.addEventListener('input', () => {
        const searchTerm = billingProductSearchInput.value.toLowerCase();
        const results = inventoryData.filter(item =>
            item.referencia.toLowerCase().includes(searchTerm) ||
            item.color.toLowerCase().includes(searchTerm)
        );
        renderSearchResults(results);
    });

    const renderSearchResults = (results) => {
        searchResultsDiv.innerHTML = '';
        if (results.length > 0) {
            const ul = document.createElement('ul');
            results.forEach(item => {
                const li = document.createElement('li');
                let details = `${item.referencia} - ${item.color} (${item.unidad})`;
                if (item.unidad === 'metros') {
                    details += `: ${item.metros} m ${item.centimetros} cm`;
                }
                li.textContent = details;
                li.addEventListener('click', () => {
                    billingProductSearchInput.value = `${item.referencia} - ${item.color}`;
                    searchResultsDiv.innerHTML = '';
                    // Seleccionar automáticamente la unidad del producto encontrado
                    document.getElementById(`billing-unit-${item.unidad}`).checked = true;
                    toggleMetersBilling();
                    if (item.unidad === 'metros') {
                        billingMetersInput.value = item.metros || 0;
                        billingCentimetersInput.value = item.centimetros || 0;
                    }
                });
                ul.appendChild(li);
            });
            searchResultsDiv.appendChild(ul);
        }
    };

    // --- Funcionalidad para Agregar a la Factura ---
    addToBillButton.addEventListener('click', () => {
        const productText = billingProductSearchInput.value.trim();
        let unidadFactura = '';
        let metrosFactura = 0;
        let centimetrosFactura = 0;

        if (document.getElementById('billing-unit-unidades').checked) {
            unidadFactura = 'unidades';
        } else if (document.getElementById('billing-unit-metros').checked) {
            unidadFactura = 'metros';
            metrosFactura = parseInt(billingMetersInput.value) || 0;
            centimetrosFactura = parseInt(billingCentimetersInput.value) || 0;
        }

        if (productText && unidadFactura) {
            const selectedProduct = inventoryData.find(item => `${item.referencia} - ${item.color}` === productText);
            if (selectedProduct) {
                const billItem = {
                    referencia: selectedProduct.referencia,
                    color: selectedProduct.color,
                    unidad: unidadFactura,
                    cantidad: unidadFactura === 'unidades' ? 1 : null, // Puedes añadir un input para la cantidad
                    metros: unidadFactura === 'metros' ? metrosFactura : null,
                    centimetros: unidadFactura === 'metros' ? centimetrosFactura : null
                };
                currentBillItems.push(billItem);
                renderBillItems();
                billingProductSearchInput.value = '';
                document.getElementById('billing-unit-unidades').checked = false;
                document.getElementById('billing-unit-metros').checked = false;
                billingMetersInput.value = '0';
                billingCentimetersInput.value = '0';
                document.getElementById('billing-meters-group').style.display = 'none';
                document.getElementById('billing-centimeters-group').style.display = 'none';
            } else {
                alert('El producto seleccionado no se encuentra en el inventario.');
            }
        } else {
            alert('Por favor, seleccione un producto y una unidad de medida para facturar.');
        }
    });

    const renderBillItems = () => {
        billingItemsListDiv.innerHTML = '';
        if (currentBillItems.length === 0) {
            billingItemsListDiv.innerHTML = '<p>No hay productos en la factura.</p>';
            return;
        }
        const ul = document.createElement('ul');
        currentBillItems.forEach(item => {
            const li = document.createElement('li');
            let details = `${item.referencia} - ${item.color} (${item.unidad})`;
            if (item.cantidad) details += `: ${item.cantidad} unidades`;
            if (item.metros !== undefined && item.centimetros !== undefined) details += `: ${item.metros} m ${item.centimetros} cm`;
            li.textContent = details;
            ul.appendChild(li);
        });
        billingItemsListDiv.appendChild(ul);
    };

    // --- Finalizar Facturación y Guardar ---
    finalizeBillingButton.addEventListener('click', async () => {
        if (currentBillItems.length > 0) {
            const fechaHora = document.getElementById('billing-datetime').value;
            const cliente = billingClientInput.value.trim();
            const venta = {
                fechaHora: fechaHora,
                cliente: cliente,
                items: currentBillItems
            };

            try {
                await salesCollection.add(venta);
                alert('Venta registrada con éxito.');
                currentBillItems = [];
                renderBillItems();
                billingClientInput.value = '';
            } catch (error) {
                console.error("Error al guardar la venta: ", error);
                alert('Error al registrar la venta.');
            }
        } else {
            alert('No hay productos en la factura para guardar.');
        }
    });
});
