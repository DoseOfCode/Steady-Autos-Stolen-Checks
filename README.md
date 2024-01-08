# Stolen Vehicle Facebook Bot

## Overview

This Express app is designed to sync information about stolen vehicles from the New Zealand Police database and provide users with the ability to check via Facebook Messenger. Additionally, it offers advertising options related to vehicle insurance and financing.

## Configuration

To set up the app, you'll need to fill in the necessary information in the ``config.json`` file:

```json
{
    "facebook": {
        "page_token": "YOUR_FACEBOOK_PAGE_TOKEN",
        "verify_token": "YOUR_FACEBOOK_VERIFY_TOKEN",
        "sender": "YOUR_SENDER_ID",

        "advertising_options": [
            "🚗 Looking for premium vehicle insurance?  Get your first month free (upto $100) Cove Insurance!!\n\n🔗 https://www.coveinsurance.co.nz/lp/steadyautos/",
            "💸 Looking to finance your next vehicle?  Get a free no-obligation quote at Simplify!\n\n🔗 https://simplify.co.nz/quote/?ref-id=R-021358"
        ]
    },

    "express": {
        "port": 3002
    }
}
```

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/DoseOfCode/Steady-Autos-Stolen-Checks
2. **Navigate to the directory**
    ```bash
    cd Steady-Autos-Stolen-Checks
3. **Install Dependencies**
    ```bash
    npm install
5. **Start the Express Server**
    ```bash
    npm start
    
## Issues

At the heart, this data is stored by the New Zealand Transport Agency & is sycned with the NZ Police during rolling periods over the day.  There **will** be delays with vehicles being includes if they are recently stolen, up to 8 hours.  If you require a more accurate database, use the New Zealand Transport Agency's [Motochek](https://www.nzta.govt.nz/vehicles/how-the-motor-vehicle-register-affects-you/requesting-register-information/motochek/what-is-motochek/) service, where the police update directly.