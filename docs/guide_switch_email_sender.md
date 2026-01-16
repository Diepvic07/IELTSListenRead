# How to Change the Email Sender (Google Apps Script)

In Google Apps Script, emails are sent from the Google Account of the person who **deployed** the Web App (when "Execute as: Me" is selected).

To change the sender from **diep@ejoy.io** to **Phuc Ha**, Phuc Ha must be the one to **deploy** the script.

Follow these steps exactly:

## Step 1: Share Access (Diep does this)
1.  Open the **Google Sheet** connected to this project.
2.  Click the **Share** button (top right).
3.  Enter Phuc Ha's Google email address (e.g., `tranlephucha@gmail.com`).
4.  Set permission to **Editor**.
5.  Click **Send**.

## Step 2: Deploy as Phuc Ha (Phuc Ha does this)
*Phuc Ha needs to perform these steps while logged into his Google Account.*

1.  Open the Google Sheet from the email invitation.
2.  Go to **Extensions** > **Apps Script**.
3.  In the script editor, click the blue **Deploy** button (top right).
4.  Select **New deployment**.
5.  Click the **Select type** (gear icon) -> **Web App**.
6.  Fill in the form:
    *   **Description**: `v1 - Sender Phuc Ha`
    *   **Execute as**: **Me** (<-- CRITICAL: This makes the email come from Phuc Ha)
    *   **Who has access**: **Anyone** (<-- CRITICAL: This allows the public website to connect)
7.  Click **Deploy**.
8.  **Authorize Access**:
    *   A popup will ask for permission. Click **Review Permissions**.
    *   Select Phuc Ha's account.
    *   If a "Google hasn't verified this app" warning appears (safe since it's your own code):
        *   Click **Advanced**.
        *   Click **Go to [Project Name] (unsafe)**.
    *   Click **Allow**.
9.  **Copy the new Web App URL**.

## Step 3: Update the Website (Developer does this)
1.  Send the **new Web App URL** to the developer (Diep).
2.  Diep will update the frontend code (`src/pages/Results.tsx`) with this new URL.
3.  Diep will re-deploy the website.

---
**Why is this necessary?**
Google prevents you from identifying as someone else (spoofing). To send email as "Phuc Ha", the script must run with Phuc Ha's authenticated authority.
