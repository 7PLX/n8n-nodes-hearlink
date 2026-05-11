import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export const HEARLINK_API_BASE_URL = 'https://app.hearlink.co.uk/api';
export const HEARLINK_INTERNAL_API_BASE_URL =
	'https://europe-west2-hearlink-production.cloudfunctions.net';

type HearLinkRequestContext = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

export function normalizeHearLinkBaseUrl(baseUrl?: string): string {
	return (baseUrl?.trim() || HEARLINK_API_BASE_URL).replace(/\/+$/, '');
}

export function cleanObject(input: IDataObject): IDataObject {
	const cleanedObject: IDataObject = {};

	for (const [key, value] of Object.entries(input)) {
		if (value === undefined || value === null || value === '') {
			continue;
		}

		if (Array.isArray(value)) {
			if (value.length > 0) {
				cleanedObject[key] = value;
			}

			continue;
		}

		if (value && typeof value === 'object') {
			const cleanedChild = cleanObject(value as IDataObject);

			if (Object.keys(cleanedChild).length > 0) {
				cleanedObject[key] = cleanedChild;
			}

			continue;
		}

		cleanedObject[key] = value;
	}

	return cleanedObject;
}

export async function hearLinkApiRequest(
	this: HearLinkRequestContext,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials<{ baseUrl?: string }>('hearLinkApi');
	const options: IHttpRequestOptions = {
		method,
		url: `${normalizeHearLinkBaseUrl(credentials.baseUrl)}${path}`,
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'hearLinkApi',
		options,
	)) as IDataObject;
}

export async function hearLinkPublicBookingRequest(
	this: HearLinkRequestContext,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${HEARLINK_INTERNAL_API_BASE_URL}${path}`,
		json: true,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	return (await this.helpers.httpRequest.call(this, options)) as IDataObject;
}

export function simplifyHearLinkResponse(response: IDataObject, simplify: boolean): IDataObject {
	if (!simplify) {
		return response;
	}

	const { data, result } = response;

	if (data && typeof data === 'object' && !Array.isArray(data)) {
		return data as IDataObject;
	}

	if (result && typeof result === 'object' && !Array.isArray(result)) {
		return result as IDataObject;
	}

	return response;
}