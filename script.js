// Constant
const API_URL =  'https://api.desco.utility.garlicgingar.com/bill_desco.php';
const VALID_BILLER_REGEX = /^\d+$/;
const DOT_ANIMATION_INTERVAL = 300;
const NO_RESULT_MESSAGE = "No result found.";

// Dropdown data
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const years = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010"];

// Validation State
const validationStatus = { month: false, year: false, biller: false };

// initialization
initializeDropdown('month', 'months-dropdown-rs', months);
initializeDropdown('year', 'year-dropdown-rs', years);
setupValidationHandlers('month', months, 'monthErrorMessage');
setupValidationHandlers('year', years, 'yearErrorMessage');
setupBillerNoValidation('biller', 'billerErrorMessage');
setupFetchBillsButton();
setupRefreshButton();

/**
 * Dropdown Initialization
 * @param {string} inputId - ID of the input field
 * @param {string} dropdownId - ID of the dropdown container
 * @param {Array} options - Array of dropdown data
 */

// Function to initialize a dropdown for a specific input and dataset
function initializeDropdown (inputId, dropdownId, options) {
    const inputElement = getElementById(inputId);
    const dropdownList = getElementById(dropdownId);

    inputElement.addEventListener('focus', () => updateDropdownList(""));
    inputElement.addEventListener('blur', () =>  setTimeout(() => hideElementById(dropdownId, true), 200));
    inputElement.addEventListener('input', () => updateDropdownList(getValueById(inputId)));

    function updateDropdownList (searchQuery) {
        hideElementById(dropdownId, false);
        searchQuery = searchQuery.trim().toLowerCase();
        clearInnerHTML(dropdownList);
        let hasResults = false;

        // Loop through dataArray and match items with search string
       options.forEach(option => {
            if(option.toLowerCase().includes(searchQuery)) {
                const dropDownItem = createDropdownItem(option);
                dropdownList.appendChild(dropDownItem);
                hasResults = true;
            }
        });
        if(!hasResults) {
            showNoResultMessage(dropdownList);
        }
    }

    /**
     * Creates a dropdown item element with click functionality.
     * @param {string} optionText - The text of the dropdown item.
     * @returns {HTMLElement} - The created dropdown item element.
     */
    function createDropdownItem(optionText) {
        const newDropdownItem = document.createElement('div');
        newDropdownItem.textContent = optionText;
        newDropdownItem.classList.add('dropdown-item');
        newDropdownItem.addEventListener('click', () => handleDropdownItemClick(optionText));
        return newDropdownItem;
    }

    /**
     * Handles dropdown item click to update the input value and hide the dropdown.
     * @param {string} selectedOption - The value of the selected dropdown item.
     */
    function handleDropdownItemClick (selectedOption) {
        setValueById(inputId, selectedOption);
        hideElementById(dropdownId, true);
        validateInput(inputId, options, `${inputId}ErrorMessage`);
    }
}

/**
 * Appends a "No result found" message to the dropdown container.
 * @param {HTMLElement} dropdownElement - The dropdown container to display the message in.
 */
function showNoResultMessage(dropdownElement) {
    const noResultDiv = document.createElement('div');
    noResultDiv.textContent = NO_RESULT_MESSAGE;
    noResultDiv.classList.add('dropdown-item', 'no-result');
    dropdownElement.appendChild(noResultDiv);
}

/**
 * Clears all items from the dropdown.
 * @param {HTMLElement} element - The container to clear.
 */
function clearInnerHTML(element) {
    element.innerHTML = '';
}

/**
 * Retrieves user input values for month, year, and biller.
 * @returns {Object} An object containing `month`, `year`, and `meterNo` values.
 */
function getUserInput() {
    return {
        month: getValueById('month'),
        year: getValueById('year'),
        meterNo: getValueById('biller'),
    };
}


/**
 * Generates a bill number based on the month, year, and biller inputs.
 * @param {string} month - Selected month.
 * @param {string} year - Selected year.
 * @param {string} meterNo - Meter number.
 * @returns {string} A unique bill number.
 */
function generateBillNumber(month, year, meterNo) {
    const monthIndex = getMonthIndex(month);
    const yearIndex = getYearIndex(year);
    return monthIndex + yearIndex + meterNo;
}


/**
 * Sets up behavior for the "Fetch Bills" button.
 * Adds a click event listener to fetch and display bill data based on user input.
 */
function setupFetchBillsButton () {
    const fetchBillsButton = getElementById('fetchBillsButton');

    fetchBillsButton.addEventListener('click', async () => {
        const { month, year, meterNo } = getUserInput();

        const billNumber = generateBillNumber(month, year, meterNo);
        const payload = createPayload(billNumber);

        const originalButtonText = fetchBillsButton.textContent;
        const loadingAnimation = startButtonLoadingAnimation(fetchBillsButton);

        try {
            const billData = await fetchBillData(payload, fetchBillsButton, originalButtonText, loadingAnimation);
            renderBillSummary(billData, month, year);
        } catch (error) {
            showErrorMessage('dataErrorMessage', true);
        } finally {
            stopButtonLoadingAnimation(fetchBillsButton, originalButtonText, loadingAnimation);
        }
    });
}


/**
 * Stops the button's loading animation and resets its text.
 * @param {HTMLElement} button - The button element.
 * @param {string} originalText - The original button text.
 * @param {number} animationInterval - The interval ID for the loading animation.
 */
function stopButtonLoadingAnimation(button, originalText, animationInterval) {
    clearInterval(animationInterval);
    button.textContent = originalText;
    button.disabled = false;
}


// Function to fetch bill data from API
async function fetchBillData(payload, button, originalButtonText, dotInterval) {
    return await fetch('https://api.desco.utility.garlicgingar.com/bill_desco.php', {
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
        .catch(error => {
            console.error('Error fetching the bill:', error);
            return [];
        })
        .finally(() => {
            clearInterval(dotInterval);
            button.textContent = originalButtonText;
        });

}

// Function to start button loading animation
function startButtonLoadingAnimation(button) {
    button.disabled = true;
    button.textContent = "Fetching";
    let dotCount = 0;
    const maxDots = 3;

    return setInterval(() => {
        dotCount = (dotCount + 1) % (maxDots + 1);
        button.textContent = "Fetching" + ".".repeat(dotCount);
    }, 300);
}

// Function to create payload for API request
function createPayload(billNumber) {
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


// Function to render bill summary into summary section
function renderBillSummary(data, monthIndex, yearIndex) {
    getElementById('month-display').textContent = months.at(monthIndex-1)+", 20"+yearIndex;

    if (!isValidData(data))  return; // return if data is not valid ex: null data


    const tableBody = getElementById("bill-summary-table");
    tableBody.innerHTML = "";

    const rows = formateDataIntoRows(data);

    rows.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.field}</td><td>${row.value}</td>`;
        tableBody.appendChild(tr);
    });

}
// Utility function to format data into rows for rendering
function formateDataIntoRows (data) {
    return [
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
}


// Function to setup refresh button behavior
function setupRefreshButton() {
    const refreshButton = getElementById('refreshButton');
    refreshButton.addEventListener('click', () => {
        hideElementById('summarySection', true);
        setValueById('month', "");
        setValueById('year', "");
        setValueById('biller', "");
    });
}



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

// Function to validate the Data received from API call
function isValidData (data) {
    if (!data.bllr_inf) {
        getElementById('summarySection').style.display = "none";
        showErrorMessage('dataErrorMessage', true);
    } else {
        getElementById('summarySection').style.display = "flex";
        showErrorMessage('dataErrorMessage', false);
    }

    return data.bllr_inf;
}

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
function hideElementById(elementId, hide) {
    getElementById(elementId).style.display = hide ? 'none' : 'block';
}

function showErrorMessage(elementId, show) {
    getElementById(elementId).style.visibility = show ? 'visible' : 'hidden';
}

function getMonthIndex (targetMonth){
    const monthIndex = months.indexOf(targetMonth) + 1;
    return String(monthIndex).padStart(2, '0');
}

function getYearIndex(targetYear) {
    return  targetYear.slice(-2);
}



