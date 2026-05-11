# @7plx/n8n-nodes-hearlink

This is an n8n community node package for the HearLink API. It adds a standard HearLink node for REST operations and a HearLink Trigger node for webhook-driven workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### HearLink

- Patients
    - Create a patient
    - Get a patient
- Appointments
    - Create an appointment
    - Get an appointment
- Invoices
    - Get an invoice

### HearLink Trigger

- Receive HearLink webhook events for patients, appointments, invoices, transactions, credit notes, hearing tests, and test deliveries
- Optionally verify `X-HearLink-Signature` using a webhook secret

## Credentials

### HearLink API

Use the HearLink API credential for the HearLink node.

1. Generate or copy an API key from your HearLink account.
2. In n8n, create a new **HearLink API** credential.
3. Keep the default base URL unless HearLink gives you a different API hostname.
4. Paste your API key into the credential.

### HearLink Webhook API

Use the HearLink Webhook API credential for the HearLink Trigger node when you want signature verification.

1. Configure a webhook signing secret in HearLink.
2. In n8n, create a new **HearLink Webhook API** credential.
3. Paste the same secret value into the credential.

If you do not configure this credential, the trigger accepts HearLink webhook payloads without signature verification.

## Usage

- The HearLink node uses the REST endpoints described in [hearlink-openapi.json](./hearlink-openapi.json).
- The HearLink Trigger node does not auto-register webhooks because the provided OpenAPI specification documents webhook payloads but does not expose webhook management endpoints.
- Copy the n8n test or production webhook URL from the HearLink Trigger node into the HearLink portal when creating your webhook subscription.
- Select the subset of events you want the trigger to pass into the workflow. Unselected events are acknowledged and ignored.

## Compatibility

Compatible with n8n@1.60.0 or later
