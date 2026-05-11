import { createHmac, timingSafeEqual } from 'node:crypto';

import {
	NodeConnectionTypes,
	type ICredentialDataDecryptedObject,
	type ICredentialTestFunctions,
	type ICredentialsDecrypted,
	type IDataObject,
	type IHookFunctions,
	type INodeCredentialTestResult,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

import { HEARLINK_EVENT_ALL, hearLinkWebhookEvents } from '../HearLink/shared/webhookEvents';

function getHeaderValue(value: string | string[] | undefined): string | undefined {
	if (typeof value === 'string') {
		return value;
	}

	if (Array.isArray(value) && value.length > 0) {
		return value[0];
	}

	return undefined;
}

function getBodyEventType(body: IDataObject): string | undefined {
	return typeof body.type === 'string' ? body.type : undefined;
}

function shouldProcessEvent(selectedEvents: string[], eventType: string): boolean {
	return (
		selectedEvents.length === 0 ||
		selectedEvents.includes(HEARLINK_EVENT_ALL) ||
		selectedEvents.includes(eventType)
	);
}

async function getWebhookSecret(context: IWebhookFunctions): Promise<string | undefined> {
	try {
		const credentials = await context.getCredentials<{ webhookSecret?: string }>('hearLinkWebhookApi');
		const webhookSecret = credentials.webhookSecret?.trim();

		return webhookSecret || undefined;
	} catch {
		return undefined;
	}
}

async function getRawBody(context: IWebhookFunctions): Promise<string> {
	const request = context.getRequestObject();

	if (!Buffer.isBuffer(request.rawBody) && typeof request.readRawBody === 'function') {
		await request.readRawBody();
	}

	if (Buffer.isBuffer(request.rawBody)) {
		return request.rawBody.toString(request.encoding || 'utf8');
	}

	return JSON.stringify(context.getBodyData());
}

function isValidSignature(rawBody: string, secret: string, signatureHeader: string): boolean {
	const signatureParts = Object.fromEntries(
		signatureHeader.split(',').map((part) => {
			const [key, value] = part.split('=');

			return [key.trim(), value?.trim() ?? ''];
		}),
	);
	const timestamp = signatureParts.t;
	const signature = signatureParts.v1;

	if (!timestamp || !signature) {
		return false;
	}

	const computedSignature = createHmac('sha256', secret)
		.update(`${timestamp}.${rawBody}`)
		.digest('hex');
	const computedBuffer = Buffer.from(computedSignature, 'utf8');
	const signatureBuffer = Buffer.from(signature, 'utf8');

	if (computedBuffer.length !== signatureBuffer.length) {
		return false;
	}

	return timingSafeEqual(computedBuffer, signatureBuffer);
}

export class HearLinkTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HearLink Trigger',
		name: 'hearLinkTrigger',
		icon: 'file:../../icons/hearlink.svg',
		group: ['trigger'],
		version: 1,
		subtitle:
			'={{$parameter["events"].includes("__all") ? "All events" : $parameter["events"].join(", ")}}',
		description: 'Start workflows when HearLink sends a webhook event',
		defaults: {
			name: 'HearLink Trigger',
		},
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'hearLinkWebhookApi',
				required: false,
				testedBy: 'testHearLinkWebhookApi',
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				responseData: 'noData',
				path: 'hearlink',
			},
		],
		properties: [
			{
				displayName:
					'Add this node’s test or production webhook URL to HearLink manually. If you configure a signing secret in HearLink, add the same value in optional HearLink Webhook API credentials to verify signatures.',
				name: 'setupNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				noDataExpression: true,
				default: [HEARLINK_EVENT_ALL],
				options: hearLinkWebhookEvents,
				description: 'Only pass these HearLink events into the workflow',
			},
		],
	};

	methods = {
		credentialTest: {
			async testHearLinkWebhookApi(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted<ICredentialDataDecryptedObject>,
			): Promise<INodeCredentialTestResult> {
				const data = credential.data ?? {};
				const webhookSecret = typeof data.webhookSecret === 'string' ? data.webhookSecret.trim() : '';

				return webhookSecret
					? {
						status: 'OK',
						message: 'Webhook secret is set.',
					}
					: {
						status: 'Error',
						message: 'Enter a webhook secret.',
					};
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				return webhookData.hearLinkWebhookReady === true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				webhookData.hearLinkWebhookReady = true;
				webhookData.hearLinkWebhookUrl = this.getNodeWebhookUrl('default');

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				delete webhookData.hearLinkWebhookReady;
				delete webhookData.hearLinkWebhookUrl;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const headers = this.getHeaderData();
		const response = this.getResponseObject();
		const eventType = getHeaderValue(headers['x-hearlink-event']) ?? getBodyEventType(body);

		if (!eventType) {
			response.status(400).json({
				message: 'Missing HearLink event type',
			});

			return {
				noWebhookResponse: true,
			};
		}

		const webhookSecret = await getWebhookSecret(this);

		if (webhookSecret) {
			const signatureHeader = getHeaderValue(headers['x-hearlink-signature']);

			if (!signatureHeader || !isValidSignature(await getRawBody(this), webhookSecret, signatureHeader)) {
				response.status(401).json({
					message: 'Invalid HearLink signature',
				});

				return {
					noWebhookResponse: true,
				};
			}
		}

		const selectedEvents = this.getNodeParameter('events') as string[];

		if (!shouldProcessEvent(selectedEvents, eventType)) {
			return {
				workflowData: [[]],
			};
		}

		const deliveryId = getHeaderValue(headers['x-hearlink-delivery']);
		const output = {
			...body,
			...(deliveryId ? { deliveryId } : {}),
		};

		return {
			workflowData: [[{ json: output }]],
		};
	}
}