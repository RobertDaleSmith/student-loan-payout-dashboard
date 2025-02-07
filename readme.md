# Student Loan Payout Dashboard

This project is a student loan payout dashboard for Dunkin Donuts' HR team. It allows the team to upload XML files containing employee loan information and process payouts using the Method API. The dashboard also provides reporting features and handles rate limiting for API requests.

## Features

- **Upload XML**: Upload an XML file containing employee loan information.
- **Batch Processing**: Handle batch processing with status tracking.
- **API Integration**: Interface with Method API to create entities, accounts, and payments.
- **Rate Limiting**: Handle rate limiting to ensure no more than 600 requests per minute.
- **CSV Reports**: Generate CSV reports for:
  - Total amount of funds paid out per unique source account.
  - Total amount of funds paid out per Dunkin branch.
  - Status of every payment and its relevant metadata.
- **User Notifications**: Display notifications for successful uploads and errors.
- **Detailed Views**: View details for each batch including payment statuses and metadata.

## Setup

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/robertdalesmith/student-loan-payout-dashboard.git
   cd student-loan-payout-dashboard
   ```

2. Install dependencies for both backend and frontend:
    ```bash
    cd backend
    npm install
    cd ../frontend
    npm install
    ```

3. Create a .env file in the backend directory with your Method API key:
    ```bash
    METHOD_API_KEY=your_method_api_key
    ```

4. Start MongoDB:
    ```bash
    mongod
    ```

5. Start the backend server:
    ```bash
    cd backend
    node server.js
    ```

6. Start the frontend development server:
    ```bash
    cd frontend
    npm start
    ```

## Usage

1. Navigate to `http://localhost:3000` in your web browser.
2. Click the "Upload XML" button to upload an XML file containing employee loan information.
3. After uploading, you will be redirected to the batch details page where you can approve or reject the batch and view detailed payment information.
4. Generate CSV reports from the batch details page.

## Running the everything with Docker

You can optionally run the entire project using Docker, which includes the frontend, backend, and MongoDB services. This allows for a consistent development environment and easy setup.

### Prerequisites

Ensure you have Docker and Docker Compose installed on your machine.

- [Docker Installation](https://docs.docker.com/get-docker/)
- [Docker Compose Installation](https://docs.docker.com/compose/install/)

### Steps to Run

1. **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/robertdalesmith/student-loan-payout-dashboard.git
    cd student-loan-payout-dashboard
    ```

2. **Add your environment variables**:
    Ensure you have the following environment variables set in the `backend/.env` file:

    ```env
    MONGO_URL=mongodb://mongo:27017/studentLoanPayoutsDB
    METHOD_API_KEY=your_api_key_here
    ```

3. **Build and run the Docker containers**:
    ```bash
    docker-compose up --build
    ```

4. **Access the application**:
    - Frontend: Open your browser and navigate to `http://localhost:3000`
    - Backend: The backend server will be running at `http://localhost:5001`
    - MongoDB: The MongoDB instance will be running on port `27017`

## Screenshots

### Dashboard

![Dashboard Screenshot](screenshots/dashboard_screenshot.png)

### Batch Details

![Batch Details Screenshot](screenshots/batch_details_screenshot.png)

## API Endpoints

### Upload XML

- **URL**: `/upload`
- **Method**: `POST`
- **Description**: Upload an XML file containing employee loan information.
- **Headers**: 
  - `Content-Type: multipart/form-data`

### Approve Batch

- **URL**: `/approve-batch/:batchId`
- **Method**: `POST`
- **Description**: Approve a batch for processing.

### Reject Batch

- **URL**: `/reject-batch/:batchId`
- **Method**: `POST`
- **Description**: Reject a batch.

### Get Batches

- **URL**: `/batches`
- **Method**: `GET`
- **Description**: Get a list of all batches.

### Get Batch Details

- **URL**: `/batch/:batchId`
- **Method**: `GET`
- **Description**: Get details for a specific batch.

### Download CSV Reports

- **URL**: `/batch/:batchId/csv/source-account`
- **Method**: `GET`
- **Description**: Download CSV report for total amount of funds paid out per unique source account.

- **URL**: `/batch/:batchId/csv/branch`
- **Method**: `GET`
- **Description**: Download CSV report for total amount of funds paid out per Dunkin branch.

- **URL**: `/batch/:batchId/csv/payments-status`
- **Method**: `GET`
- **Description**: Download CSV report for the status of every payment and its relevant metadata.

## Project Structure

```java
student-loan-payout-dashboard/
│
├── backend/
│   ├── models/
│   │   ├── Account.js
│   │   ├── Batch.js
│   │   ├── Entity.js
│   │   └── Payment.js
│   ├── worker.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload.js
│   │   │   ├── BatchList.js
│   │   │   └── BatchDetails.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── .gitignore
└── README.md
```
