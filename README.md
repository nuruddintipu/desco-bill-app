# DESCO Bill App

This application allows users to dynamically fetch yearly postpaid bills for a DESCO account using a valid bill number. 
It includes features like dropdowns for selecting months and years, form validation, API integration, and a responsive design.
his app simplifies the process of retrieving postpaid bill details for DESCO users.
****


## Features

- #### **Dynamic Dropdowns:**  
  Allows users to select a month (January to December) and a year (2010 to 2024) to fetch bill details dynamically.

- #### **API Integration:**  
  Fetches bill data from the DESCO API based on the provided bill number, month, and year.

- #### **Validation:**
    - Ensures that all fields (**bill number**, **month**, and **year**) are filled before submission.
    - Validates the bill number format before making API requests.

- #### **Error Handling:**  
  Displays a "No data found" message when the API returns no data for a valid bill number.

- #### **Responsive Design:**  
  The interface is optimized for both desktop and mobile devices.
****


## Installation
## Prerequisites
-  A modern web browser (e.g., Google Chrome, Microsoft Edge).
-  A local or online server (optional if running directly from the file system).



## Steps
### 1. Clone this repository
```bash
   git clone 'https://github.com/nuruddintipu/desco-bill-app'
```
### 2. Navigate to the project folder 
```bash
   cd desco-bill-app
```
****



## Usage
 1. Enter a valid bill number.
 2. Select a month (January–December).
 3. Select a year (2010–2024).
 4. Click the Submit button to fetch the bill detail.
 5. The app requires an active internet connection for API calls, if applicable.


## Error Scenarios
- If no data is found, a "No data found" message will be displayed.
- Ensure all fields are correctly filled; otherwise, validation messages will appear.
****


## Folder Structure
```
desco-bill-app/
│
├── index.html       # Main HTML file for the app
├── css/
│   └── style.css    # Styles for the app
├── js/
│   └── script.js    # Main JavaScript file
└── README.md        # Project documentation
```
****


## Technologies Used
* HTML5
* CSS3
* JavaScript
****



## Contribution Guidelines
1. Fork the repository.
2. Create a feature branch:
```bash
git checkout -b feature-name
```
3. Commit your changes:
```bash
git commit -m "Description of changes"
```
4. Push to the branch:
```bash
git push origin feature-name
```
5. Create a pull request.
****



## License
This project is licensed under the [MIT License](LICENSE).
****

## Contact
For any inquiries or issues, feel free to contact:
- Nuruddin Tipu
- [nuruddintipu.connect@gmail.com](mailto:nuruddintipu.connect@gmail.com)
****