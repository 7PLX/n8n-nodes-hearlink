import type {
	Icon,
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { HEARLINK_API_BASE_URL } from '../nodes/HearLink/shared/transport';

export class HearLinkApi implements ICredentialType {
	name = 'hearLinkApi';

	displayName = 'HearLink API';

	icon: Icon = 'file:../icons/hearlink.svg';

	documentationUrl = 'https://github.com/7PLX/n8n-nodes-hearlink?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: HEARLINK_API_BASE_URL,
			required: true,
			placeholder: HEARLINK_API_BASE_URL,
			description: 'The base URL for the HearLink API',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The API key used to authenticate requests to HearLink',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl}}',
			url: '/patients/00000000-0000-0000-0000-000000000000',
			method: 'GET',
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 404,
					message: 'Connection successful.',
				},
			},
		],
	};
}