import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class HearLinkWebhookApi implements ICredentialType {
	name = 'hearLinkWebhookApi';

	displayName = 'HearLink Webhook API';

	icon: Icon = 'file:../icons/hearlink.svg';

	documentationUrl = 'https://github.com/7PLX/n8n-nodes-hearlink?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Webhook Secret',
			name: 'webhookSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'The signing secret configured for your HearLink webhook.',
		},
	];
}