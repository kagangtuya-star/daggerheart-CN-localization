// Editor for damage values and modifiers

export class DamagePanel {
	_id = null;
	_data = null;
	_sheet = null;
	_onSave = null;

	get id() {
		return this._id;
	}

	get element_id() {
		return `panel-damage-${this._id}`;
	}

	get value() {
		let parts = [];

		this._data.permanentModifiers.forEach(mod => {
			if (!mod.enabled || !mod.value) return;

			if (!mod.value.startsWith('+') && !mod.value.startsWith('-')) {
				mod.value = `+${mod.value}`;
			}
			parts.push(mod.value);
		});
		this._data.modifiers.forEach(mod => {
			if (!mod.enabled || !mod.value) return;

			if (!mod.value.startsWith('+') && !mod.value.startsWith('-')) {
				mod.value = `+${mod.value}`;
			}
			parts.push(mod.value);
		});

		if (!parts.length) return this._data.baseValue;
		return `${this._data.baseValue}${parts.join('')}`;
	}

	constructor(options = {}, data = {}) {
		this._data = data;

		// Required, can not be null
		this._id = options.id;
		this._sheet = options.sheet;
		this._onSave = options.onSave;
	}

	async create() {
		const modifier = {
			id: `${this._id}-${Math.random().toString(6)}`,
			name: 'Modifier',
			value: '+1',
			enabled: true,
		};

		this._data.modifiers.push(modifier);
		this._data.value = this.value;

		await this._onSave(this._data);
	}

	async delete(index) {
		if (index < 0 || index >= this._data.modifiers.length) {
			ui.notifications.error('Failed to delete the modifier.');
			return;
		}

		this._data.modifiers.splice(index, 1);
		this._data.value = this.value;

		await this._onSave(this._data);

		// Refocus an input element
		this._focusInput();
	}

	async update(data) {
		switch (data.name) {
			case 'damage-base-value':
				return await this._updateBaseValue(data);
			case 'damage-modifier-name':
				return await this._updateModifierName(data);
			case 'damage-modifier-value':
				return await this._updateModifierValue(data);
			case 'damage-modifier-enabled':
				return await this._updateModifierEnabled(data);
			case 'damage-permanent-name':
				return true; // Ignore, should be disabled
			case 'damage-permanent-value':
				return true; // Ignore, should be disabled
			case 'damage-permanent-enabled':
				return await this._updatePermanentEnabled(data);

			default:
				return false;
		}
	}

	_focusInput() {
		// Grab the focus of the name input to create new elements
		const overlay = document.getElementById(`panel-damage-${this._id}`);
		overlay.querySelector('.damage-base-value').focus();
	}

	_validModifier(index) {
		if (index < 0 || index >= this._data.modifiers.length) {
			ui.notifications.error('Invalid modifier index, reload.');
			return false;
		}
		return true;
	}

	_validPermanent(index) {
		if (index < 0 || index >= this._data.permanentModifiers.length) {
			ui.notifications.error('Invalid permanent modifier index, reload.');
			return false;
		}
		return true;
	}

	async _updateBaseValue(data) {
		// ToDo Validate value and adjust

		this._data.baseValue = data.value;
		this._data.value = this.value;

		this._data = await this._onSave(this._data);

		return true;
	}

	async _updateModifierName(elm) {
		const index = elm.dataset.index;
		if (!this._validModifier(index)) return;

		// ToDo Validate value and adjust
		this._data.modifiers[index].name = elm.value;
		this._data = await this._onSave(this._data);

		return true;
	}

	async _updateModifierValue(elm) {
		const index = elm.dataset.index;
		if (!this._validModifier(index)) return;

		// ToDo Validate value and adjust
		this._data.modifiers[index].value = elm.value;
		this._data.value = this.value;

		this._data = await this._onSave(this._data);

		return true;
	}

	async _updateModifierEnabled(elm) {
		const index = elm.dataset.index;
		if (!this._validModifier(index)) return;

		this._data.modifiers[index].enabled = elm.checked;
		this._data.value = this.value;

		this._data = await this._onSave(this._data);

		return true;
	}

	async _updatePermanentEnabled(elm) {
		const index = elm.dataset.index;
		if (!this._validPermanent(index)) return;

		this._data.permanentModifiers[index].enabled = elm.value;
		this._data.value = this.value;

		this._data = await this._onSave(this._data);

		return true;
	}
}
