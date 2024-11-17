// Constant
const API_URL =  'https://api.desco.utility.garlicgingar.com/bill_desco.php';
const VALID_BILLER_REGEX = /^\d+$/;
const DOT_ANIMATION_INTERVAL = 300;
const NO_RESULT_MESSAGE = "No result found.";
let currentData;

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
// enableMonthNavigation();

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
 * Sets up behavior for the "Fetch Bills" button.
 * Adds a click event listener to fetch and display bill data based on user input.
 */
function setupFetchBillsButton () {
    const fetchBillsButtonElement  = getElementById('fetchBillsButton');

    fetchBillsButtonElement .addEventListener('click', async () => {
        const { month, year, meterNo } = getUserInput();

        const billNumber = generateBillNumber(month, year, meterNo);

        const originalButtonText = fetchBillsButtonElement .textContent;
        const loadingAnimation = startButtonLoadingAnimation(fetchBillsButtonElement );

        await processBillData(fetchBillsButtonElement, billNumber, month, year, originalButtonText, loadingAnimation);
    });
}

/**
 * Processes bill data by creating a payload, fetching data, rendering the summary,
 * and handling errors or resetting the button state.
 *
 * @param {HTMLElement} buttonElement - The button element triggering the process.
 * @param {string} billNo - The bill number to be processed.
 * @param {string} month - The month related to the bill (name or index-based, depending on usage).
 * @param {string|number} year - The year related to the bill.
 * @param {string} originalButtonText - The original text of the button, used to reset its state.
 * @param {HTMLElement} loadingAnimation - The animation element to indicate loading state.
 * @returns {Promise<void>} - A promise that resolves once the process is complete.
 */
async function processBillData(buttonElement, billNo, month, year, originalButtonText, loadingAnimation) {
    try {
        const payload = createPayload(billNo);
        const billData = await fetchBillData(payload, buttonElement, originalButtonText, loadingAnimation);
        renderBillSummary(billData, month, year);
    } catch (error) {
        displayErrorMessage('dataErrorMessage', true);
    } finally {
        resetButtonState(buttonElement, originalButtonText, loadingAnimation);
    }
}


/**
 * Fetches bill data from the API using the provided payload.
 * Handles loading state and error scenarios.
 *
 * @param {Object} payload - The payload to send in the POST request.
 * @param {HTMLElement} buttonElement - The button triggering the fetch operation.
 * @param {string} originalButtonText - The original text of the button before loading.
 * @param {number} loadingAnimation - The interval ID for the button loading animation.
 * @returns {Promise<Object|Array>} - The fetched bill data or an empty array on failure.
 */
async function fetchBillData(payload, buttonElement, originalButtonText, loadingAnimation) {
    return await fetch(API_URL, {
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
        });
}


/**
 * Creates a payload for the API request with provided bill details.
 * @param {string} billNumber - The bill number to include in the payload.
 * @returns {Object} - The generated payload for the API request.
 */
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

/**
 * Updates the month and year display section based on the provided month and year indices.
 *
 * @param {String} month - The index of the month.
 * @param {String} year - The index of the year.
 */
function updateMonthYearDisplay(month, year) {
    const monthDisplayElement = getElementById('month-display');
    monthDisplayElement.textContent = `${month}, ${year}`;
}



/**
 * Renders the bill summary into the summary section by updating the UI with the provided data.
 *
 * @param {Array} data - The data containing the bill summary information.
 * @param {String} month - The target month.
 * @param {String} year - The target year.
 */
function renderBillSummary(data, month, year) {
    updateMonthYearDisplay(month, year);

    if (!isValidData(data))  return;
    currentData = data;
    enableMonthNavigation()
    const tableBody = getElementById("bill-summary-table");
    tableBody.innerHTML = "";

    const rows = formateDataIntoRows(data);

    rows.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.field}</td><td>${row.value}</td>`;
        tableBody.appendChild(tr);
    });
}


/**
 * Enables navigation through months by updating the displayed data for the specified month and year.
 */
function enableMonthNavigation() {
    const prevMonthElement = getElementById('prevMonth');
    const nextMonthElement = getElementById('nextMonth');

    prevMonthElement.addEventListener('click', () => goToPrevMonth());
    nextMonthElement.addEventListener('click', () => goToNextMonth());
}

async function goToPrevMonth() {
    await navigateMonth(-1);
}


async function goToNextMonth() {
    await navigateMonth(+1);
}

/**
 * Handles navigation to a different month based on the given direction.
 *
 * @param {number} direction - The direction to navigate (-1 for previous month, 1 for next month).
 */
async function navigateMonth(direction) {
    const { bll_dt_frm, bllr_accno } = currentData.bllr_inf;
    const [currYearFull, currMonthIndex] = bll_dt_frm.split('-').map(Number);

    const { newMonthIndex, newYear } = calculateNewDate(currMonthIndex, currYearFull % 100, direction);

    const billNo = generateBillNumber(months[newMonthIndex-1], "20"+newYear, bllr_accno);

    // Fetch and render the new bill data
    await fetchAndRenderBill(billNo, newMonthIndex, newYear, "20"+newYear);
}



/**
 * Calculates the new month and year based on the current month, year, and navigation direction.
 *
 * @param {number} currMonth - The current month (1-12).
 * @param {number} currYear - The last two digits of the current year.
 * @param {number} direction - The direction to navigate (-1 for previous, 1 for next).
 * @returns {Object} An object containing the new month and year.
 */
function calculateNewDate(currMonth, currYear, direction) {
    let newMonthIndex = currMonth + direction;
    if (newMonthIndex < 1) {
        newMonthIndex = 12;
        currYear--;
    } else if (newMonthIndex > 12) {
        newMonthIndex = 1;
        currYear++;
    }
    return { newMonthIndex, newYear: currYear };
}

/**
 * Fetches and renders the bill data for the specified parameters.
 *
 * @param {string} billNo - The bill number to fetch.
 * @param {number} month - The new month (1-12).
 * @param {number} year - The last two digits of the new year.
 * @param {number} fullYear - The full year (e.g., 2024).
 */
async function fetchAndRenderBill(billNo, month, year, fullYear) {
    const buttonElement = getElementById('fetchBillsButton');
    const loadingAnimation = startButtonLoadingAnimation(buttonElement);

    const monthName = months[month-1];
    await processBillData(buttonElement, billNo, monthName, fullYear, "Fetch Bills", loadingAnimation);
}



/**
 * Formats the bill summary data into an array of rows containing field and value.
 *
 * @param {Array} data - The raw bill data.
 * @returns {Array} - The formatted array of rows.
 */
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



/**
 * Sets up the behavior for the "Refresh" button.
 * Clears the input fields and hides the summary section when clicked.
 */
function setupRefreshButton() {
    const refreshButton = getElementById('refreshButton');
    refreshButton.addEventListener('click', () => {
        hideElementById('summarySection', true);
        setValueById('month', "");
        setValueById('year', "");
        setValueById('biller', "");
    });
}

/**
 * Enables or disables the "Fetch Bills" button based on validation status.
 * The button is enabled only if all fields are valid.
 */
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



/**
 * Validates the data received from the API call.
 * Checks if the data contains valid information and displays error message if invalid.
 *
 * @param {Object} data - The data received from the API call.
 * @returns {boolean} - Returns true if the data is valid, otherwise false.
 */
function isValidData (data) {
    if (!data.bllr_inf) {
        getElementById('summarySection').style.display = "none";
        displayErrorMessage('dataErrorMessage', true);
    } else {
        getElementById('summarySection').style.display = "flex";
        displayErrorMessage('dataErrorMessage', false);
    }

    return data.bllr_inf;
}

/**
 * Sets up validation handlers for input fields.
 * Adds event listeners for input and blur events to trigger validation.
 *
 * @param {string} inputId - The ID of the input field to validate.
 * @param {Array} validValues - An array of valid values for the input field.
 * @param {string} errorMessageId - The ID of the element where the error message will be displayed.
 */
function setupValidationHandlers (inputId, validValues, errorMessageId) {
    const inputField = getElementById(inputId);

    // Validate on focus/typing
    inputField.addEventListener('input', () => validateInput(inputId, validValues, errorMessageId));

    // Validate on blur
    inputField.addEventListener('blur', () => validateInput(inputId, validValues, errorMessageId));

}

/**
 * Validates the input field value.
 * Checks if the input value is included in the valid values array and displays an error message if invalid.
 *
 * @param {string} fieldId - The ID of the input field to validate.
 * @param {Array} validValues - An array of valid values for the input field.
 * @param {string} errorMessageId - The ID of the error message element.
 */
function validateInput(fieldId, validValues, errorMessageId) {

    const inputValue = getValueById(fieldId).trim();
    const isValid = validValues.includes(inputValue);

    validationStatus[fieldId] = isValid; // Update validation status
    displayErrorMessage(errorMessageId, !isValid);  //  Show/Hide error message
    toggleFetchBillsButton();          //   Enable/disable fetch bills button
}

/**
 * Sets up biller number validation for input fields.
 * Adds event listeners for input and blur events to trigger validation specific to biller number.
 *
 * @param {string} inputId - The ID of the input field to validate.
 * @param {string} errorMessageId - The ID of the element where the error message will be displayed.
 */
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

/**
 * Validates the biller number input.
 * Ensures that the input value contains only digits.
 *
 * @param {string} inputId - The ID of the biller input field to validate.
 * @param {string} errorMessageId - The ID of the error message element.
 */
function validateBillerNo (inputId, errorMessageId) {
    const inputValue = getValueById(inputId).trim();
    const isValidInput = VALID_BILLER_REGEX.test(inputValue); //only digits are allowed

    validationStatus[inputId] = isValidInput; // Update validation status
    displayErrorMessage(errorMessageId, !isValidInput);  //  Show/Hide error message
    toggleFetchBillsButton();          //   Enable/disable fetch bills button
}


/**
 * Starts the button loading animation by disabling the button,
 * changing its text, and displaying a loading animation with dots.
 *
 * @param {HTMLElement} buttonElement - The button element to apply the animation to.
 * @returns {number} - The interval ID to stop the animation later.
 */
function startButtonLoadingAnimation(buttonElement) {
    buttonElement.disabled = true;

    buttonElement.textContent = "Fetching";

    let dotCount = 0;
    const maxDots = 3;

    return setInterval(() => {
        dotCount = (dotCount + 1) % (maxDots + 1);
        buttonElement.textContent = "Fetching" + ".".repeat(dotCount);
    }, DOT_ANIMATION_INTERVAL);
}

/**
 * Hides or displays an element based on the `hide` flag.
 *
 * @param {string} elementId - The ID of the element to hide or show.
 * @param {boolean} hide - Whether to hide the element (true) or show it (false).
 */
function hideElementById(elementId, hide) {
    getElementById(elementId).style.display = hide ? 'none' : 'block';
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
 * Displays or hides an error message for an element based on the `show` flag.
 *
 * @param {string} elementId - The ID of the error message element.
 * @param {boolean} show - Whether to show the error message (true) or hide it (false).
 */
function displayErrorMessage(elementId, show) {
    getElementById(elementId).style.visibility = show ? 'visible' : 'hidden';
}


/**
 * Stops the button's loading animation and resets its text.
 * @param {HTMLElement} button - The button element.
 * @param {string} originalText - The original button text.
 * @param {number} animationInterval - The interval ID for the loading animation.
 */
function resetButtonState(button, originalText, animationInterval) {
    clearInterval(animationInterval);
    button.textContent = originalText;
    button.disabled = false;
}

/**
 * Gets the month index (1-based) for the provided month name.
 *
 * @param {string} targetMonth - The name of the month (e.g., "January").
 * @returns {string} - The 2-digit month index (e.g., "01").
 */
function getMonthIndex (targetMonth){
    const monthIndex = months.indexOf(targetMonth) + 1;
    return String(monthIndex).padStart(2, '0');
}

/**
 * Gets the 2-digit year index from the provided year string (e.g., "2024" -> "24").
 *
 * @param {string} targetYear - The year string (e.g., "2024").
 * @returns {string} - The last two digits of the year (e.g., "24").
 */
function getYearIndex(targetYear) {
    return  targetYear.slice(-2);
}



/**
 * Retrieves an element by its ID.
 *
 * @param {string} elementId - The ID of the element to retrieve.
 * @returns {HTMLElement} - The DOM element with the specified ID.
 */
function getElementById (elementId) {
    return document.getElementById(elementId);
}

/**
 * Retrieves the value of an element by its ID.
 *
 * @param {string} elementId - The ID of the element to get the value from.
 * @returns {string} - The value of the element.
 */
function getValueById (elementId) {
    return getElementById(elementId).value;
}

/**
 * Sets the value of an element by its ID.
 *
 * @param {string} elementId - The ID of the element to set the value of.
 * @param {string} value - The value to set for the element.
 */
function setValueById(elementId, value) {
    getElementById(elementId).value = value;
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