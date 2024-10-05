let meals = [];
let editingIndex = null; // Zum Speichern des Indexes des zu bearbeitenden Gerichts

// Funktion zum Hinzufügen von Mahlzeiten
function addMeal() {
    const mealName = document.getElementById('meal-name').value.trim();
    const mealIngredientsInput = document.getElementById('meal-ingredients').value.split(',');

    const mealIngredients = mealIngredientsInput.map(ingredient => {
        const trimmedIngredient = ingredient.trim();
        if (!trimmedIngredient) {
            return null; // Leere Zutaten ignorieren
        }

        const parts = trimmedIngredient.split(' ');
        const quantity = parts[0] ? parseFloat(parts[0]) || 0 : null; // Wenn keine Menge eingegeben wird, setze auf null
        const unit = parts[1] ? parts[1] : ''; // Einheit (g, ml, Stk, etc.)
        const name = parts.slice(2).join(' ').trim(); // Der Rest ist der Name der Zutat

        // Rückgabe der Zutat, auch wenn keine Menge angegeben ist
        return { name, quantity: quantity !== null ? quantity : '', unit: unit }; 
    }).filter(ingredient => ingredient !== null); // Entferne leere Zutaten

    if (mealName && mealIngredients.length) {
        if (editingIndex !== null) {
            meals[editingIndex] = { name: mealName, ingredients: mealIngredients };
            editingIndex = null;
        } else {
            meals.push({ name: mealName, ingredients: mealIngredients });
        }
        updateMealList();
        localStorage.setItem('meals', JSON.stringify(meals));
        resetForm();
    } else {
        alert('Bitte einen Namen und Zutaten eingeben.');
    }
}

// Funktion zum Bearbeiten eines Gerichts
function editMeal(index) {
    const meal = meals[index];
    document.getElementById('meal-name').value = meal.name;
    document.getElementById('meal-ingredients').value = meal.ingredients.map(ingredient => {
        return `${ingredient.quantity ? ingredient.quantity : ''} ${ingredient.unit ? ingredient.unit : ''} ${ingredient.name}`.trim();
    }).join(', ');

    editingIndex = index; // Den Index des zu bearbeitenden Gerichts speichern
}

// Funktion zum Löschen eines Gerichts
function deleteMeal(index) {
    if (confirm("Möchten Sie dieses Gericht wirklich löschen?")) {
        meals.splice(index, 1); // Gericht aus dem Array entfernen
        localStorage.setItem('meals', JSON.stringify(meals)); // Aktualisiere den localStorage
        updateMealList(); // Aktualisiere die Liste der Mahlzeiten auf der Seite
    }
}

// Funktion zum Aktualisieren der Mahlzeitenliste
function updateMealList() {
    const mealList = document.getElementById('meal-list');
    mealList.innerHTML = ''; // Leere die Liste, bevor du sie neu aufbaust
    meals.forEach((meal, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="meal-item">
                <input type="checkbox" id="meal-${index}" class="meal-checkbox" data-index="${index}">
                <label for="meal-${index}"><strong>${meal.name}</strong></label> <br> 
                Zutaten: ${meal.ingredients.map(ingredient => 
                    ingredient.quantity ? `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}` : ingredient.name).join(', ')}
                <div class="button-container">
                    <button class="edit-button" onclick="editMeal(${index})">Bearbeiten</button>
                    <button class="delete-button" onclick="deleteMeal(${index})">Löschen</button>
                </div>
            </div>
        `;
        listItem.classList.add('meal-item');
        mealList.appendChild(listItem);
    });
}

// Funktion zum Zurücksetzen des Formulars nach dem Speichern oder Bearbeiten
function resetForm() {
    document.getElementById('meal-name').value = '';
    document.getElementById('meal-ingredients').value = '';
    editingIndex = null; // Bearbeitungsmodus verlassen
}

// Beim Laden der Seite die gespeicherten Gerichte aus dem localStorage abrufen
window.onload = function() {
    const storedMeals = JSON.parse(localStorage.getItem('meals')) || [];
    meals = storedMeals; // Gespeicherte Gerichte in das meals-Array laden
    updateMealList(); // Liste der Mahlzeiten auf der Seite aktualisieren
};

// Funktion zum Generieren der Einkaufsliste
function generateShoppingList() {
    const shoppingList = document.getElementById('shopping-list');
    shoppingList.innerHTML = ''; 

    const ingredientsMap = {};
    const checkboxes = document.querySelectorAll('.meal-checkbox:checked'); // Nur die ausgewählten Checkboxen

    checkboxes.forEach(checkbox => {
        const mealIndex = checkbox.getAttribute('data-index'); // Korrekte Indexreferenz
        const meal = meals[mealIndex]; // Das gewählte Gericht abrufen

        meal.ingredients.forEach(ingredient => {
            const key = ingredient.name; // Hier nur den Namen der Zutat verwenden
            if (ingredientsMap[key]) {
                ingredientsMap[key].quantity += (parseFloat(ingredient.quantity) || 0); // Summiere die Menge, wenn sie vorhanden ist
            } else {
                ingredientsMap[key] = {
                    quantity: (parseFloat(ingredient.quantity) || 0),
                    unit: ingredient.unit || ''
                };
            }
        });
    });

    for (const [name, { quantity, unit }] of Object.entries(ingredientsMap)) {
        const listItem = document.createElement('li');
        listItem.textContent = quantity > 0 ? `${quantity} ${unit} ${name}` : name; // Zeige die Menge und Einheit oder nur den Namen
        shoppingList.appendChild(listItem);
    }
}

// Funktion zum Senden der E-Mail
function sendEmail() {
    const shoppingList = document.getElementById('shopping-list');
    const shoppingListItems = shoppingList.innerHTML; // Inhalt der Einkaufsliste abrufen

    const subject = encodeURIComponent("Einkaufsliste");
    const body = encodeURIComponent(`Hier ist meine Einkaufsliste:\n\n${shoppingListItems}`);
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    // Den E-Mail-Client öffnen
    window.location.href = mailtoLink;
}

// Funktion zum Herunterladen der gespeicherten Gerichte
function downloadMeals() {
    if (meals.length === 0) {
        alert('Es gibt keine Mahlzeiten zum Herunterladen.');
        return;
    }

    const dataStr = JSON.stringify(meals);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meals.json'; // Der Name der herunterladbaren Datei
    document.body.appendChild(a);
    a.click(); // Simuliere den Klick auf den Link
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Gib den Speicherplatz für die URL wieder frei
}

// Funktion zum Hochladen von gespeicherten Gerichten
function importFromFile(event) {
    const file = event.target.files[0]; // Die ausgewählte Datei abrufen
    const reader = new FileReader(); // FileReader erstellen

    reader.onload = function(e) {
        const data = JSON.parse(e.target.result); // JSON-Daten parsen
        meals = data; // Die Mahlzeiten mit den importierten Daten überschreiben
        localStorage.setItem('meals', JSON.stringify(meals)); // Mahlzeiten im localStorage speichern
        updateMealList(); // Liste der Mahlzeiten auf der Seite aktualisieren
    };

    if (file) {
        reader.readAsText(file); // Die Datei als Text lesen
    }
}
