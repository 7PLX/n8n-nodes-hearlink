import type { INodePropertyOptions } from 'n8n-workflow';

export const HEARLINK_EVENT_ALL = '__all';

export const hearLinkWebhookEvents: INodePropertyOptions[] = [
	{
		name: 'All Events',
		value: HEARLINK_EVENT_ALL,
		description: 'Pass every supported HearLink webhook event into the workflow',
	},
	{ name: 'Appointment Created', value: 'appointment.created' },
	{ name: 'Appointment Deleted', value: 'appointment.deleted' },
	{ name: 'Appointment Updated', value: 'appointment.updated' },
	{ name: 'Credit Note Created', value: 'credit_note.created' },
	{ name: 'Credit Note Deleted', value: 'credit_note.deleted' },
	{ name: 'Credit Note Updated', value: 'credit_note.updated' },
	{ name: 'Hearing Test Created', value: 'hearing_test.created' },
	{ name: 'Hearing Test Deleted', value: 'hearing_test.deleted' },
	{ name: 'Hearing Test Updated', value: 'hearing_test.updated' },
	{ name: 'Invoice Created', value: 'invoice.created' },
	{ name: 'Invoice Deleted', value: 'invoice.deleted' },
	{ name: 'Invoice Updated', value: 'invoice.updated' },
	{ name: 'Patient Created', value: 'patient.created' },
	{ name: 'Patient Deleted', value: 'patient.deleted' },
	{ name: 'Patient Updated', value: 'patient.updated' },
	{ name: 'Transaction Created', value: 'transaction.created' },
	{ name: 'Transaction Deleted', value: 'transaction.deleted' },
	{ name: 'Transaction Updated', value: 'transaction.updated' },
	{ name: 'Webhook Test', value: 'webhook.test' },
];