import { ItemBaseSheet } from './item-base.mjs';

export class ItemArmorSheet extends ItemBaseSheet {
	static DEFAULT_OPTIONS = {
		classes: ['uo', 'item', 'sheet', 'armor', 'application'],
		position: {
			width: 320,
			height: 580,
		},
	};

	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		// Name the content partial
		context.content = 'item-armor';

		return context;
	}
}
