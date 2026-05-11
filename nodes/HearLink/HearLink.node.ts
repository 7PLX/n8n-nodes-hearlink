import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type ICredentialDataDecryptedObject,
	type ICredentialTestFunctions,
	type ICredentialsDecrypted,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type INodeCredentialTestResult,
	type INodeProperties,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

import {
	cleanObject,
	hearLinkApiRequest,
	normalizeHearLinkBaseUrl,
	simplifyHearLinkResponse,
} from './shared/transport';

const patientDisplayOptions = {
	resource: ['patient'],
};

const appointmentDisplayOptions = {
	resource: ['appointment'],
};

const invoiceDisplayOptions = {
	resource: ['invoice'],
};

const showForPatientGet = {
	resource: ['patient'],
	operation: ['get'],
};

const showForPatientCreate = {
	resource: ['patient'],
	operation: ['create'],
};

const showForAppointmentGet = {
	resource: ['appointment'],
	operation: ['get'],
};

const showForAppointmentCreate = {
	resource: ['appointment'],
	operation: ['create'],
};

const showForInvoiceGet = {
	resource: ['invoice'],
	operation: ['get'],
};

const operationProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Appointment',
				value: 'appointment',
			},
			{
				name: 'Invoice',
				value: 'invoice',
			},
			{
				name: 'Patient',
				value: 'patient',
			},
		],
		default: 'patient',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: patientDisplayOptions,
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a patient',
				action: 'Create a patient',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a patient by UID',
				action: 'Get a patient',
			},
		],
		default: 'create',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: appointmentDisplayOptions,
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create an appointment',
				action: 'Create an appointment',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an appointment by UID',
				action: 'Get an appointment',
			},
		],
		default: 'create',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: invoiceDisplayOptions,
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get an invoice by UID',
				action: 'Get an invoice',
			},
		],
		default: 'get',
	},
	{
		displayName: 'Simplify Output',
		name: 'simplifyOutput',
		type: 'boolean',
		default: true,
		description: 'Whether to return only the HearLink data payload instead of the full API response envelope',
	},
];

const patientProperties: INodeProperties[] = [
	{
		displayName: 'Patient UID',
		name: 'patientUid',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8d1e3d17-60a9-4b92-bf0b-4c0a4a0d3a15',
		displayOptions: {
			show: showForPatientGet,
		},
		description: 'The UID of the patient to retrieve',
	},
	{
		displayName: 'Full Name',
		name: 'fullName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showForPatientCreate,
		},
		description: 'The full name of the patient',
	},
	{
		displayName: 'Primary Phone Number',
		name: 'primaryPhoneNumber',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showForPatientCreate,
		},
		description: 'The patient’s primary phone number',
	},
	{
		displayName: 'Referral Lookup By',
		name: 'referralIdentifierType',
		type: 'options',
		required: true,
		default: 'name',
		displayOptions: {
			show: showForPatientCreate,
		},
		options: [
			{
				name: 'ID',
				value: 'id',
			},
			{
				name: 'Name',
				value: 'name',
			},
		],
		description: 'Choose whether to identify the referral by ID or by name',
	},
	{
		displayName: 'Referral ID',
		name: 'referralId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				...showForPatientCreate,
				referralIdentifierType: ['id'],
			},
		},
		description: 'The HearLink referral ID',
	},
	{
		displayName: 'Referral Name',
		name: 'referralName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				...showForPatientCreate,
				referralIdentifierType: ['name'],
			},
		},
		description: 'The HearLink referral name',
	},
	{
		displayName: 'Primary Clinic Lookup By',
		name: 'primaryClinicIdentifierType',
		type: 'options',
		required: true,
		default: 'name',
		displayOptions: {
			show: showForPatientCreate,
		},
		options: [
			{
				name: 'ID',
				value: 'id',
			},
			{
				name: 'Name',
				value: 'name',
			},
		],
		description: 'Choose whether to identify the primary clinic by ID or by name',
	},
	{
		displayName: 'Primary Clinic ID',
		name: 'primaryClinicId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				...showForPatientCreate,
				primaryClinicIdentifierType: ['id'],
			},
		},
		description: 'The HearLink primary clinic ID',
	},
	{
		displayName: 'Primary Clinic Name',
		name: 'primaryClinicName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				...showForPatientCreate,
				primaryClinicIdentifierType: ['name'],
			},
		},
		description: 'The HearLink primary clinic name',
	},
	{
		displayName: 'Status Lookup By',
		name: 'statusIdentifierType',
		type: 'options',
		required: true,
		default: 'name',
		displayOptions: {
			show: showForPatientCreate,
		},
		options: [
			{
				name: 'ID',
				value: 'id',
			},
			{
				name: 'Name',
				value: 'name',
			},
		],
		description: 'Choose whether to identify the status by ID or by name',
	},
	{
		displayName: 'Status ID',
		name: 'statusId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				...showForPatientCreate,
				statusIdentifierType: ['id'],
			},
		},
		description: 'The HearLink status ID',
	},
	{
		displayName: 'Status Name',
		name: 'statusName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				...showForPatientCreate,
				statusIdentifierType: ['name'],
			},
		},
		description: 'The HearLink status name',
	},
	{
		displayName: 'Tracking Provider',
		name: 'trackingProvider',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showForPatientCreate,
		},
		description: 'The marketing or tracking provider name required by HearLink',
	},
	{
		displayName: 'Tracking IDs',
		name: 'trackingIds',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: showForPatientCreate,
		},
		description: 'Optional tracking identifiers as a JSON object, for example {"gclid":"123abc"}',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: showForPatientCreate,
		},
		description: 'Optional patient address as a JSON object, for example {"line1":"1 Main St","city":"Manchester"}',
	},
	{
		displayName: 'Additional Fields',
		name: 'patientAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showForPatientCreate,
		},
		options: [
			{
				displayName: 'Age',
				name: 'age',
				type: 'number',
				default: 0,
				description: 'The patient age',
			},
			{
				displayName: 'Date of Birth',
				name: 'dob',
				type: 'string',
				default: '',
				placeholder: '1985-07-12',
				description: 'The patient date of birth in YYYY-MM-DD format',
			},
			{
				displayName: 'Email Address',
				name: 'emailAddress',
				type: 'string',
				default: '',
				description: 'The patient email address',
			},
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'string',
				default: '',
				description: 'The patient gender value to send to HearLink',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Internal notes to store on the patient',
			},
			{
				displayName: 'Secondary Phone Number',
				name: 'secondaryPhoneNumber',
				type: 'string',
				default: '',
				description: 'An additional phone number for the patient',
			},
			{
				displayName: 'Secondary Status ID',
				name: 'secondaryStatusId',
				type: 'string',
				default: '',
				description: 'Optional secondary status ID. Use either this field or Secondary Status Name.',
			},
			{
				displayName: 'Secondary Status Name',
				name: 'secondaryStatusName',
				type: 'string',
				default: '',
				description: 'Optional secondary status name. Use either this field or Secondary Status ID.',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The patient title',
			},
			{
				displayName: 'UTM Campaign',
				name: 'utmCampaign',
				type: 'string',
				default: '',
				description: 'Optional UTM campaign value',
			},
			{
				displayName: 'UTM Content',
				name: 'utmContent',
				type: 'string',
				default: '',
				description: 'Optional UTM content value',
			},
			{
				displayName: 'UTM Medium',
				name: 'utmMedium',
				type: 'string',
				default: '',
				description: 'Optional UTM medium value',
			},
			{
				displayName: 'UTM Source',
				name: 'utmSource',
				type: 'string',
				default: '',
				description: 'Optional UTM source value',
			},
			{
				displayName: 'UTM Term',
				name: 'utmTerm',
				type: 'string',
				default: '',
				description: 'Optional UTM term value',
			},
		],
	},
];

const appointmentProperties: INodeProperties[] = [
	{
		displayName: 'Appointment UID',
		name: 'appointmentUid',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8d1e3d17-60a9-4b92-bf0b-4c0a4a0d3a15',
		displayOptions: {
			show: showForAppointmentGet,
		},
		description: 'The UID of the appointment to retrieve',
	},
	{
		displayName: 'Patient ID',
		name: 'patientId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showForAppointmentCreate,
		},
		description: 'The HearLink patient ID for the appointment',
	},
	{
		displayName: 'Appointment Type ID',
		name: 'appointmentTypeId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showForAppointmentCreate,
		},
		description: 'The HearLink appointment type ID',
	},
	{
		displayName: 'Clinic ID',
		name: 'clinicId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showForAppointmentCreate,
		},
		description: 'The HearLink clinic ID',
	},
	{
		displayName: 'Assignee ID',
		name: 'assigneeId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showForAppointmentCreate,
		},
		description: 'The HearLink user ID assigned to the appointment',
	},
	{
		displayName: 'Date',
		name: 'date',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2026-05-12',
		displayOptions: {
			show: showForAppointmentCreate,
		},
		description: 'The appointment date in YYYY-MM-DD format',
	},
	{
		displayName: 'Start Time',
		name: 'start',
		type: 'string',
		required: true,
		default: '',
		placeholder: '09:00',
		displayOptions: {
			show: showForAppointmentCreate,
		},
		description: 'The appointment start time in HH:mm format',
	},
	{
		displayName: 'End Time',
		name: 'end',
		type: 'string',
		required: true,
		default: '',
		placeholder: '09:45',
		displayOptions: {
			show: showForAppointmentCreate,
		},
		description: 'The appointment end time in HH:mm format',
	},
	{
		displayName: 'Location',
		name: 'location',
		type: 'options',
		required: true,
		default: 'clinic',
		displayOptions: {
			show: showForAppointmentCreate,
		},
		options: [
			{
				name: 'Clinic',
				value: 'clinic',
			},
			{
				name: 'Home',
				value: 'home',
			},
		],
		description: 'Where the appointment will take place',
	},
	{
		displayName: 'Send Confirmation',
		name: 'sendConfirmation',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: showForAppointmentCreate,
		},
		description: 'Whether HearLink should send a confirmation to the patient',
	},
	{
		displayName: 'Additional Fields',
		name: 'appointmentAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showForAppointmentCreate,
		},
		options: [
			{
				displayName: 'Additional Note',
				name: 'additionalNote',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Additional notes for the appointment',
			},
			{
				displayName: 'Referral ID',
				name: 'referralId',
				type: 'string',
				default: '',
				description: 'The optional HearLink referral ID to attach to the appointment',
			},
		],
	},
];

const invoiceProperties: INodeProperties[] = [
	{
		displayName: 'Invoice UID',
		name: 'invoiceUid',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8d1e3d17-60a9-4b92-bf0b-4c0a4a0d3a15',
		displayOptions: {
			show: showForInvoiceGet,
		},
		description: 'The UID of the invoice to retrieve',
	},
];

function getRequiredStringParameter(
	context: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
	label: string,
): string {
	const value = context.getNodeParameter(parameterName, itemIndex) as string;
	const trimmedValue = value.trim();

	if (!trimmedValue) {
		throw new NodeOperationError(context.getNode(), `${label} is required`, {
			itemIndex,
		});
	}

	return trimmedValue;
}

function getOptionalStringFromCollection(collection: IDataObject, key: string): string | undefined {
	const value = collection[key];

	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmedValue = value.trim();

	return trimmedValue || undefined;
}

function getJsonObjectParameter(
	context: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
	label: string,
): IDataObject {
	const value = context.getNodeParameter(parameterName, itemIndex, {}) as unknown;

	if (typeof value === 'string') {
		const trimmedValue = value.trim();

		if (!trimmedValue) {
			return {};
		}

		try {
			const parsedValue = JSON.parse(trimmedValue) as unknown;

			if (parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)) {
				return parsedValue as IDataObject;
			}
		} catch {
			throw new NodeOperationError(context.getNode(), `${label} must be valid JSON`, {
				itemIndex,
			});
		}
	}

	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as IDataObject;
	}

	throw new NodeOperationError(context.getNode(), `${label} must be a JSON object`, {
		itemIndex,
	});
}

function normalizeTrackingIds(trackingIds: IDataObject): IDataObject | undefined {
	const normalizedIds = Object.fromEntries(
		Object.entries(trackingIds)
			.map(([key, value]) => {
				const trimmedKey = key.trim();

				if (!trimmedKey || value === undefined || value === null || value === '') {
					return undefined;
				}

				return [trimmedKey, String(value)] as const;
			})
			.filter((entry): entry is readonly [string, string] => entry !== undefined),
	);

	return Object.keys(normalizedIds).length > 0 ? (normalizedIds as IDataObject) : undefined;
}

function getPatientCreateBody(context: IExecuteFunctions, itemIndex: number): IDataObject {
	const referralIdentifierType = context.getNodeParameter('referralIdentifierType', itemIndex) as string;
	const primaryClinicIdentifierType = context.getNodeParameter(
		'primaryClinicIdentifierType',
		itemIndex,
	) as string;
	const statusIdentifierType = context.getNodeParameter('statusIdentifierType', itemIndex) as string;
	const trackingProvider = getRequiredStringParameter(
		context,
		'trackingProvider',
		itemIndex,
		'Tracking Provider',
	);
	const trackingIds = getJsonObjectParameter(context, 'trackingIds', itemIndex, 'Tracking IDs');
	const address = getJsonObjectParameter(context, 'address', itemIndex, 'Address');
	const additionalFields = context.getNodeParameter('patientAdditionalFields', itemIndex, {}) as IDataObject;
	const secondaryStatusId = getOptionalStringFromCollection(additionalFields, 'secondaryStatusId');
	const secondaryStatusName = getOptionalStringFromCollection(additionalFields, 'secondaryStatusName');

	if (secondaryStatusId && secondaryStatusName) {
		throw new NodeOperationError(
			context.getNode(),
			'Use either Secondary Status ID or Secondary Status Name, not both',
			{ itemIndex },
		);
	}

	const tracking = cleanObject({
		provider: trackingProvider,
		ids: normalizeTrackingIds(trackingIds),
		utm_term: getOptionalStringFromCollection(additionalFields, 'utmTerm'),
		utm_campaign: getOptionalStringFromCollection(additionalFields, 'utmCampaign'),
		utm_content: getOptionalStringFromCollection(additionalFields, 'utmContent'),
		utm_medium: getOptionalStringFromCollection(additionalFields, 'utmMedium'),
		utm_source: getOptionalStringFromCollection(additionalFields, 'utmSource'),
	});

	return cleanObject({
		fullName: getRequiredStringParameter(context, 'fullName', itemIndex, 'Full Name'),
		primaryPhoneNumber: getRequiredStringParameter(
			context,
			'primaryPhoneNumber',
			itemIndex,
			'Primary Phone Number',
		),
		[referralIdentifierType === 'id' ? 'referralId' : 'referralName']: getRequiredStringParameter(
			context,
			referralIdentifierType === 'id' ? 'referralId' : 'referralName',
			itemIndex,
			referralIdentifierType === 'id' ? 'Referral ID' : 'Referral Name',
		),
		[primaryClinicIdentifierType === 'id' ? 'primaryClinicId' : 'primaryClinicName']:
			getRequiredStringParameter(
				context,
				primaryClinicIdentifierType === 'id' ? 'primaryClinicId' : 'primaryClinicName',
				itemIndex,
				primaryClinicIdentifierType === 'id' ? 'Primary Clinic ID' : 'Primary Clinic Name',
			),
		[statusIdentifierType === 'id' ? 'statusId' : 'statusName']: getRequiredStringParameter(
			context,
			statusIdentifierType === 'id' ? 'statusId' : 'statusName',
			itemIndex,
			statusIdentifierType === 'id' ? 'Status ID' : 'Status Name',
		),
		title: getOptionalStringFromCollection(additionalFields, 'title'),
		secondaryPhoneNumber: getOptionalStringFromCollection(additionalFields, 'secondaryPhoneNumber'),
		emailAddress: getOptionalStringFromCollection(additionalFields, 'emailAddress'),
		dob: getOptionalStringFromCollection(additionalFields, 'dob'),
		age:
			typeof additionalFields.age === 'number' && Number.isFinite(additionalFields.age)
				? additionalFields.age
				: undefined,
		gender: getOptionalStringFromCollection(additionalFields, 'gender'),
		notes: getOptionalStringFromCollection(additionalFields, 'notes'),
		secondaryStatusId,
		secondaryStatusName,
		address: cleanObject(address),
		tracking,
	});
}

function getAppointmentCreateBody(context: IExecuteFunctions, itemIndex: number): IDataObject {
	const additionalFields = context.getNodeParameter('appointmentAdditionalFields', itemIndex, {}) as IDataObject;

	return cleanObject({
		patientId: getRequiredStringParameter(context, 'patientId', itemIndex, 'Patient ID'),
		appointmentTypeId: getRequiredStringParameter(
			context,
			'appointmentTypeId',
			itemIndex,
			'Appointment Type ID',
		),
		clinicId: getRequiredStringParameter(context, 'clinicId', itemIndex, 'Clinic ID'),
		assigneeId: getRequiredStringParameter(context, 'assigneeId', itemIndex, 'Assignee ID'),
		date: getRequiredStringParameter(context, 'date', itemIndex, 'Date'),
		start: getRequiredStringParameter(context, 'start', itemIndex, 'Start Time'),
		end: getRequiredStringParameter(context, 'end', itemIndex, 'End Time'),
		location: context.getNodeParameter('location', itemIndex) as string,
		sendConfirmation: context.getNodeParameter('sendConfirmation', itemIndex, false) as boolean,
		additionalNote: getOptionalStringFromCollection(additionalFields, 'additionalNote'),
		referralId: getOptionalStringFromCollection(additionalFields, 'referralId'),
	});
}

export class HearLink implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HearLink',
		name: 'hearLink',
		icon: 'file:../../icons/hearlink.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create HearLink patients and appointments, and retrieve HearLink records',
		defaults: {
			name: 'HearLink',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'hearLinkApi',
				required: true,
				testedBy: 'testHearLinkApi',
			},
		],
		properties: [...operationProperties, ...patientProperties, ...appointmentProperties, ...invoiceProperties],
	};

	methods = {
		credentialTest: {
			async testHearLinkApi(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted<ICredentialDataDecryptedObject>,
			): Promise<INodeCredentialTestResult> {
				const data = credential.data ?? {};
				const baseUrl = normalizeHearLinkBaseUrl(
					typeof data.baseUrl === 'string' ? data.baseUrl : undefined,
				);
				const apiKey = typeof data.apiKey === 'string' ? data.apiKey.trim() : '';

				if (!apiKey) {
					return {
						status: 'Error',
						message: 'Enter an API key.',
					};
				}

				try {
					const credentialTestHelpers = this.helpers as typeof this.helpers & {
						httpRequest: (options: IHttpRequestOptions) => Promise<{ statusCode?: number; status?: number }>;
					};
					const response = await credentialTestHelpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/patients/00000000-0000-0000-0000-000000000000`,
						headers: {
							'x-api-key': apiKey,
							Accept: 'application/json',
						},
						returnFullResponse: true,
						ignoreHttpStatusErrors: true,
					});
					const statusCode = response.statusCode ?? response.status ?? 0;

					if (statusCode === 200 || statusCode === 404) {
						return {
							status: 'OK',
							message: 'Connection successful.',
						};
					}

					if (statusCode === 401 || statusCode === 403) {
						return {
							status: 'Error',
							message: 'HearLink rejected the API key or its permissions.',
						};
					}

					return {
						status: 'Error',
						message: `HearLink returned status ${statusCode}.`,
					};
				} catch (error) {
					return {
						status: 'Error',
						message:
							error instanceof Error ? error.message : 'Unable to connect to HearLink.',
					};
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const simplifyOutput = this.getNodeParameter('simplifyOutput', itemIndex, true) as boolean;

				let responseData: IDataObject;

				switch (`${resource}:${operation}`) {
					case 'patient:create': {
						responseData = await hearLinkApiRequest.call(
							this,
							'POST',
							'/patients/create',
								getPatientCreateBody(this, itemIndex),
						);
						break;
					}
					case 'patient:get': {
							const patientUid = getRequiredStringParameter(this, 'patientUid', itemIndex, 'Patient UID');

						responseData = await hearLinkApiRequest.call(
							this,
							'GET',
							`/patients/${encodeURIComponent(patientUid)}`,
						);
						break;
					}
					case 'appointment:create': {
						responseData = await hearLinkApiRequest.call(
							this,
							'POST',
							'/appointments/create',
								getAppointmentCreateBody(this, itemIndex),
						);
						break;
					}
					case 'appointment:get': {
							const appointmentUid = getRequiredStringParameter(
								this,
								'appointmentUid',
								itemIndex,
								'Appointment UID',
							);

						responseData = await hearLinkApiRequest.call(
							this,
							'GET',
							`/appointments/${encodeURIComponent(appointmentUid)}`,
						);
						break;
					}
					case 'invoice:get': {
							const invoiceUid = getRequiredStringParameter(this, 'invoiceUid', itemIndex, 'Invoice UID');

						responseData = await hearLinkApiRequest.call(
							this,
							'GET',
							`/invoices/${encodeURIComponent(invoiceUid)}`,
						);
						break;
					}
					default:
						throw new NodeOperationError(this.getNode(), `The operation ${operation} is not supported for ${resource}`, {
							itemIndex,
						});
				}

				returnData.push({
					json: simplifyHearLinkResponse(responseData, simplifyOutput),
					pairedItem: {
						item: itemIndex,
					},
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : 'Unknown error',
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}

				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error.message, {
						itemIndex,
					});
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, {
					itemIndex,
				});
			}
		}

		return [returnData];
	}
}