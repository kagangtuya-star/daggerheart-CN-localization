import { ResourcesPanel } from '../utility/panel-resources.mjs';
import { PanelManager } from '../utility/panel-manager.mjs';
import { buildItemCardChat } from '../../helpers/helper.js';
import { path } from '../../helpers/templates.js';

const { api, sheets } = foundry.applications;

export class ItemBaseSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
	_panels = null;
	_resources = null;

	static DEFAULT_OPTIONS = {
		classes: ['uo', 'item', 'sheet', 'application'],
		editPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		form: {
			submitOnChange: true,
		},
		position: {
			width: 320,
			height: 480,
		},
		window: {
			resizable: true,
			controls: [
				{
					icon: 'fas fa-comment-alt',
					label: 'To Chat',
					action: 'to-chat',
				},
			],
		},
		actions: {
			'to-chat': this.#toChat,
			'image-edit': this.#editImage,
			'panel-open': this.#openPanel,
			'panel-close': this.#closePanel,
			'resources-create': this.#createResources,
			'resources-delete': this.#deleteResources,
			'resources-update': this.#updateResources,
		},
	};

	static PARTS = {
		item_base: {
			template: `${path}/views/sheets/item-base.hbs`,
		},
		panel_menu: {
			template: `${path}/partials/sheets/panel-menu.hbs`,
		},
		panel_resources: {
			template: `${path}/partials/sheets/panel-resources.hbs`,
		},
	};

	constructor(options = {}) {
		super(options);

		this._resources = new ResourcesPanel({
			id: this.item.id,
			sheet: this,
			onSave: this.onSaveResources.bind(this),
			resources: this.item.system.resourceTrackers,
		});
		this._panels = new PanelManager({
			id: this.item.id,
			sheet: this,
			panels: {
				resources: {
					id: this._resources.element_id,
					icon: 'fas fa-stopwatch',
					show: true,
				},
			},
		});
	}

	async _onRender(context, options) {
		// New dom elements are created on every render, so link it all up.
		const list = this.element.querySelector('.tracker-list');
		for (const child of list.children) {
			child.addEventListener('mousedown', async event => {
				event.preventDefault();
				event.stopPropagation();
				const index = event.target.dataset?.index;

				if (event.which === 1) {
					this._resources.increase(index);
				} else if (event.which === 3) {
					this._resources.decrease(index);
				}
			});
		}
	}

	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		// A unique lookup id
		context.id = this.item.id;
		// Name the content partial
		context.content = 'item-base';

		context.item = this.item;
		context.system = this.item.system;

		context.panels = this._panels.state;
		context.resources = this._resources.state;

		context.description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			this.item.system.description,
			{
				secrets: this.document.isOwner,
				async: true,
			}
		);

		return context;
	}

	async _processSubmitData(event, form, formData) {
		if (event.type !== 'change' || !event.target) {
			// Ignore it, note this blocks up stream
			return false;
		}

		if (this._resources.update(event.target)) {
			return false;
		}

		return await this.document.update(formData);
	}

	async _attachFrameListeners() {
		super._attachFrameListeners();

		// Add listeners and setup a tab index for focus
		this.element.addEventListener('keydown', this._panels.onKeydown.bind(this._panels));
		this.element.setAttribute('tabindex', '0');
	}

	async onSaveResources(data) {
		await this.item.update({
			system: { resourceTrackers: data },
		});
	}

	static async #toChat(event, elem) {
		const actor =
			canvas.tokens.controlled[0]?.actor ??
			game.user?.character ??
			new Actor({
				name: game.user.name,
				type: 'character',
			});

		const chatCard = buildItemCardChat({
			itemId: this.item.id,
			actorId: actor.id,
			image: this.item.img,
			name: this.item.name,
			itemType: this.item.type,
			system: this.item.system,
			category: this.item.system.category || '',
			rarity: this.item.system.rarity || '',
			description: this.item.system.description || '',
		});

		ChatMessage.create({
			user: game.user.id,
			speaker: ChatMessage.getSpeaker({ actor }),
			content: chatCard,
		});
	}

	static async #editImage(event, elem) {
		event.preventDefault();

		const fp = new FilePicker({
			type: 'image',
			current: this.item.img,
			callback: path => {
				this.item.update({
					img: path,
				});
			},
			top: this.position.top + 40,
			left: this.position.left + 10,
		});
		return fp.browse();
	}

	static async #openPanel(event, elem) {
		// TODO If something is open then ??
		await this._panels.open(elem.dataset?.key);
	}

	static async #closePanel(event, elem) {
		// TODO If resources is not open ??
		await this._panels.close(elem.dataset?.key);
	}

	static async #createResources(event, elem) {
		await this._resources.create();
	}

	static async #deleteResources(event, elem) {
		const index = elem.dataset.index;
		await this._resources.delete(index);
	}

	static async #updateResources(event, elem) {
		const data = {};
		const index = elem.dataset.index;
		await this._resources.create(index, data);
	}
}
