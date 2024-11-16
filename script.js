// Array of month and year values for dropdown data
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var years = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010"];

// Initialize dropdowns for month and year inputs
initializeDropdown('month', 'months-dropdown-rs', months);
initializeDropdown('year', 'year-dropdown-rs', years);

// Attach click event for fetch bill button
setupFetchBillsButton();

//  Attach click event for refresh button
setupRefreshButton();


// Attach validation handlers to all input
setupValidationHandlers('month', months, 'monthErrorMessage');
setupValidationHandlers('year', years, 'yearErrorMessage');
setupBillerNoValidation('biller', 'billerErrorMessage');


// Function to initialize a dropdown for a specific input and dataset
function initializeDropdown (inputId, dropdownId, dataArray) {
    var inputField = getElementById(inputId); // Input field reference
    var dropdown = getElementById(dropdownId); // Dropdown container reference

    // Show full dropdown when input field is focused
    inputField.addEventListener('focus', function () {
        updateDropdown(""); // Show all items initially
    });

    // Hide dropdown shortly after losing focus
    inputField.addEventListener('blur', function () {
        setTimeout(function () {
            hideById(dropdownId, true);
        }, 200);

    });

    // Update dropdown items based on current input
    inputField.addEventListener('input', function () {
        updateDropdown(getValueById(inputId));
    });

    // Function to update dropdown based on search string
    function updateDropdown (searchString) {
        hideById(dropdownId, false); // Make dropdown visible
        searchString = searchString.trim().toLowerCase(); // Convert search string to lowercase
        dropdown.innerHTML = "";
        var isExist = false; // Flag to check if any result found

        // Loop through dataArray and match items with search string
        for(var i = 0; i < dataArray.length; i++) {
            if(dataArray[i].toLowerCase().includes(searchString)) {
                const item = document.createElement('div'); // Create dropdown item
                item.textContent = dataArray[i]; // Set item text
                item.classList.add('dropdown-item'); // Add class for styling

                // Attach click event to update input field with selected item
                item.addEventListener('click', function() {
                    onClickListItem(item);
                });
                dropdown.appendChild(item); // Add item to dropdown
                isExist = true;
            }
        }

        // Display message if no matching result is found
        if(!isExist) {
            dropdown.innerHTML = "No result found.";

        }
    }

    // Function to set input field value and hide dropdown on item selection
    function onClickListItem (dataItem) {
        setValueById(inputId, dataItem.innerText); // Set selected value to input
        hideById(dropdownId, true); // Hide dropdown
        validateInput(inputId, dataArray, `${inputId}ErrorMessage`);
    }
}

// Function to setup fetch bills button behavior
function setupFetchBillsButton() {
    const fetchBillsButton = getElementById('fetchBillsButton');
    fetchBillsButton.addEventListener('click', async () => {
        const targetMonth = getValueById('month');
        const targetYear = getValueById('year');
        const billerNo = getValueById('biller');

        const originalButtonText = fetchBillsButton.textContent;
        const dotInterval = startButtonLoadingAnimation(fetchBillsButton);

        const payload = createPayload(targetMonth, targetYear, billerNo);

        fetchBillData(payload, fetchBillsButton, originalButtonText, dotInterval);
    });
}

// Function to start button loading animation
function startButtonLoadingAnimation(button) {
    button.disabled = true;
    button.textContent = "Fetching";
    let dotCount = 0;
    const maxDots = 3;

    const interval = setInterval(() => {
        dotCount = (dotCount + 1) % (maxDots + 1);
        button.textContent = "Fetching" + ".".repeat(dotCount);
    }, 300);

    return interval;
}

// Function to create payload for API request
function createPayload(targetMonth, targetYear, billerNo) {
    const monthIndex = months.indexOf(targetMonth) + 1;
    const formattedMonth = String(monthIndex).padStart(2, '0');
    const yearLastTwoDigits = targetYear.slice(-2);
    const billNumber = formattedMonth + yearLastTwoDigits + billerNo;

    return {
        hdrs: {
            nm: "",
            ver: "",
            tms: new Date().toISOString(),
            ref_id: "",
            nd_id: ""
        },
        trx: {
            trx_id: "",
            trx_tms: new Date().toISOString()
        },
        isOffline: false,
        bll_inf: {
            bll_cstnm: "",
            bll_loc_cd: "",
            bllr_id: "b025",
            bll_no: billNumber,
            bll_period: "",
            meter_no: "",
            bllr_accno: "",
            bill_mobno: "",
            bll_typ: "NM",
            xchng_code: "",
            last_pay_dt: "",
            mode: "WEB",
            amount: ""
        },
        usr_inf: {}
    };
}

// Function to fetch bill data from API
function fetchBillData(payload, button, originalButtonText, dotInterval) {
    fetch('https://api.desco.utility.garlicgingar.com/bill_desco.php', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => renderBillSummary(data))
        .catch(error => console.error('Error fetching the bill:', error))
        .finally(() => {
            clearInterval(dotInterval);
            button.textContent = originalButtonText;
            button.disabled = false;
        });
}

// Function to render bill summary into a table
function renderBillSummary(data) {
    // getElementById('month-display').textContent = data.bllr_inf.bll_dt_frm;
    if (!data.bllr_inf) {
        showErrorMessage('dataErrorMessage', true);
        return;
    }
    getElementById('summarySection').style.display = "flex";

    const tableBody = document.querySelector("#bill-summary-table tbody");
    tableBody.innerHTML = "";

    const rows = [
        { field: "Customer Name", value: data.bllr_inf.bll_cstnm },
        { field: "Bill Number", value: data.bllr_inf.bll_no },
        { field: "Account Number", value: data.bllr_inf.bllr_accno },
        { field: "Meter Number", value: data.bllr_inf.meter_no },
        { field: "Billing Period", value: data.bllr_inf.bll_dt_frm },
        { field: "Due Date", value: data.bllr_inf.bll_dt_due },
        { field: "Total Usage (kWh)", value: data.bllr_inf.totalKwh },
        { field: "Base Amount", value: data.bllr_inf.bll_amnt },
        { field: "VAT", value: data.bllr_inf.bll_vat },
        { field: "Late Fee", value: data.bllr_inf.bll_late_fee },
        { field: "Total Amount", value: `<span style="font-weight: bold; color: red;">${data.bllr_inf.bll_amnt_ttl}</span>` }
    ];

    rows.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.field}</td><td>${row.value}</td>`;
        tableBody.appendChild(tr);
    });
}

// Function to setup refresh button behavior
function setupRefreshButton() {
    const refreshButton = getElementById('refreshButton');
    refreshButton.addEventListener('click', () => {
        hideById('summarySection', true);
        setValueById('month', "");
        setValueById('year', "");
        setValueById('biller', "");
    });
}



// Track validation status for each field
let validationStatus = {
    month: false,
    year: false,
    biller: false
};

// function to setup validation to all inputs
function setupValidationHandlers (inputId, validValues, errorMessageId) {
    const inputField = getElementById(inputId);

    // Validate on focus/typing
    inputField.addEventListener('input', () => validateInput(inputId, validValues, errorMessageId));

    // Validate on blur
    inputField.addEventListener('blur', () => validateInput(inputId, validValues, errorMessageId));

}

// Function to validate a input
function validateInput(fieldId, validValues, errorMessageId) {

    const inputValue = getValueById(fieldId).trim();
    const isValid = validValues.includes(inputValue);

    validationStatus[fieldId] = isValid; // Update validation status
    showErrorMessage(errorMessageId, !isValid);  //  Show/Hide error message
    toggleFetchBillsButton();          //   Enable/disable fetch bills button
}

// Functions to setup biller field validation
function setupBillerNoValidation (inputId, errorMessageId) {
    const inputField = getElementById(inputId);

//     Validate on typing
    inputField.addEventListener('input', () => {
       validateBillerNo(inputId, errorMessageId)
    });

//     Validate on blur
    inputField.addEventListener('blur', () => {
       validateBillerNo(inputId, errorMessageId)
    });

}

// Function to validate a biller input
function validateBillerNo (inputId, errorMessageId) {
    const inputValue = getValueById(inputId).trim();
    const isValidInput = /^\d+$/.test(inputValue); //only digits are allowed

    validationStatus[inputId] = isValidInput; // Update validation status
    showErrorMessage(errorMessageId, !isValidInput);  //  Show/Hide error message
    toggleFetchBillsButton();          //   Enable/disable fetch bills button
}

// Function to enable or disable the fetch bills button
function toggleFetchBillsButton () {
    const isAllButtonValid = Object.values(validationStatus).every(Boolean); // Check all fields
    const fetchBillsButton = getElementById('fetchBillsButton');
    fetchBillsButton.disabled = !isAllButtonValid;
    if(!isAllButtonValid){
        fetchBillsButton.style.backgroundColor = '#0059c3';
    } else {
        fetchBillsButton.style.backgroundColor = '';
    }
}


// Function to make arrow key functional
//function

// Utility Functions
function getElementById (elementId) {
    return document.getElementById(elementId);
}
function getValueById (elementId) {
    return getElementById(elementId).value;
}
function setValueById(elementId, value) {
    getElementById(elementId).value = value;
}
function hideById(elementId, hide) {
    getElementById(elementId).style.display = hide ? 'none' : 'block';
}

function showErrorMessage(elementId, show) {
    getElementById(elementId).style.visibility = show ? 'visible' : 'hidden';
}