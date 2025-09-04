import { DamagePanel } from '../utility/panel-damage.mjs';
import { ItemBaseSheet } from './item-base.mjs';
import { path } from '../../helpers/templates.js';
import { attachSelectOptions } from '../../helpers/select-options.mjs';

const { mergeObject } = foundry.utils;

export class ItemWeaponSheet extends ItemBaseSheet {
	_editDamage = null;

	_traitOptions = null;
	_rangeOptions = null;
	_damageOptions = null;

	static DEFAULT_OPTIONS = {
		classes: ['uo', 'item', 'sheet', 'weapon', 'application'],
		position: {
			width: 320,
			height: 580,
		},
		actions: {
			'edit-damage': this.#editDamage,
			'create-modifier': this.#createModifier,
			'delete-modifier': this.#deleteModifier,
		},
	};

	static PARTS = mergeObject(super.PARTS, {
		panel_damage: {
			template: `${path}/partials/sheets/panel-damage.hbs`,
		},
	});

	constructor(options = {}) {
		super(options);

		this._editDamage = new DamagePanel(
			{
				id: this.item.id,
				sheet: this,
				onSave: this.onSaveDamage.bind(this),
			},
			{
				...this.item.system.damage,
			}
		);
		this._panels.register({
			damage: {
				id: this._editDamage.element_id,
				icon: 'fa-solid fa-swords',
				show: false,
			},
		});
	}

	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		// Name the content partial
		context.content = 'item-weapon';

		// TODO on set we need to translate active value to label
		context.traitOptions = {
			key: `select-trait-${this.item.id}`,
			active: context.system.trait ? context.system.trait : 'Pick a Trait',
			options: [
				{ active: false, value: 'agility', label: game.i18n.localize('DH.Agility') },
				{ active: false, value: 'strength', label: game.i18n.localize('DH.Strength') },
				{ active: false, value: 'finesse', label: game.i18n.localize('DH.Finesse') },
				{ active: false, value: 'instinct', label: game.i18n.localize('DH.Instinct') },
				{ active: false, value: 'presence', label: game.i18n.localize('DH.Presence') },
				{ active: false, value: 'knowledge', label: game.i18n.localize('DH.Knowledge') },
			],
		};
		context.traitOptions.options.forEach(element => {
			if (element.value === context.traitOptions.active) {
				element.active = true;
			}
		});

		context.rangeOptions = {
			key: `select-range-${this.item.id}`,
			active: context.system.range ? context.system.range : 'Pick a Range',
			options: [
				{ active: false, value: 'melee', label: game.i18n.localize('DH.Melee') },
				{ active: false, value: 'veryClose', label: game.i18n.localize('DH.VeryClose') },
				{ active: false, value: 'close', label: game.i18n.localize('DH.Close') },
				{ active: false, value: 'far', label: game.i18n.localize('DH.Far') },
				{ active: false, value: 'veryFar', label: game.i18n.localize('DH.VeryFar') },
			],
		};
		context.rangeOptions.options.forEach(element => {
			if (element.value === context.rangeOptions.active) {
				element.active = true;
			}
		});

		context.damageOptions = {
			key: `select-damage-${this.item.id}`,
			active: context.system.damageType ? context.system.damageType : 'Pick a Type',
			options: [
				{ active: false, value: 'magical', label: game.i18n.localize('DH.Magical') },
				{ active: false, value: 'physical', label: game.i18n.localize('DH.Physical') },
			],
		};
		context.damageOptions.options.forEach(element => {
			if (element.value === context.damageOptions.active) {
				element.active = true;
			}
		});

		return context;
	}

	async _processSubmitData(event, form, formData) {
		if (event.type !== 'change' || !event.target) {
			// Ignore it, note this blocks up stream
			return false;
		}

		if (await this._editDamage.update(event.target)) {
			// Event has been handled
			return false;
		}
		return super._processSubmitData(event, form, formData);
	}

	async _onRender(context, options) {
		super._onRender();

		// on render attach the new weapon-specific select elements
		attachSelectOptions(`select-trait-${this.item.id}`, async value => {
			await this.item.update({
				system: { trait: value },
			});
		});
		attachSelectOptions(`select-range-${this.item.id}`, async value => {
			await this.item.update({
				system: { range: value },
			});
		});
		attachSelectOptions(`select-damage-${this.item.id}`, async value => {
			await this.item.update({
				system: { damageType: value },
			});
		});
	}

	async onSaveDamage(data) {
		await this.item.update({
			system: { damage: data },
		});
		return this.item.system.damage;
	}

	static async #editDamage() {
		this._panels.open('damage');
	}

	static async #createModifier() {
		await this._editDamage.create();
	}

	static async #deleteModifier(event, elem) {
		const index = elem.dataset.index;
		await this._editDamage.delete(index);
	}
}
