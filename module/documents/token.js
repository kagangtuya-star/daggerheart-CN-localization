/**
 * Extend the base TokenDocument to support resource type attributes.
 * @extends {TokenDocument}
 */
export class SimpleTokenDocument extends TokenDocument {
	/** @inheritdoc */
	getBarAttribute(barName, { alternative } = {}) {
		const data = super.getBarAttribute(barName, { alternative });
		const attr = alternative || this[barName]?.attribute;
		if (!data || !attr || !this.actor) return data;
		const current = foundry.utils.getProperty(this.actor.system, attr);
		if (current?.dtype === 'Resource') data.min = parseInt(current.min || 0);
		data.editable = true;
		return data;
	}

	/* -------------------------------------------- */

	static getTrackedAttributes(data, _path = []) {
		if (data || _path.length) return super.getTrackedAttributes(data, _path);
		data = {};
		// Bail if no actor is assigned
		if (!game?.system?.model?.Actor) {
			return super.getTrackedAttributes(data);
		}
		for (const model of Object.values(game.system.model.Actor)) {
			foundry.utils.mergeObject(data, model);
		}
		for (const actor of game.actors) {
			if (actor.isTemplate) foundry.utils.mergeObject(data, actor.toObject());
		}
		return super.getTrackedAttributes(data);
	}

	static getTrackedAttributeChoices(attributes, model) {
		attributes = attributes || this.getTrackedAttributes();
		const barGroupLabel = game.i18n.localize('TOKEN.BarAttributes');
		const valueGroupLabel = game.i18n.localize('TOKEN.BarValues');

		const barEntries = Array.isArray(attributes?.bar)
			? attributes.bar.map(pathSegments => {
				const joinedPath = pathSegments.join('.');
				const schemaFieldLabel = model ? game.i18n.localize(model.schema.getField(`${joinedPath}.value`)?.label ?? '') : null;
				return { group: barGroupLabel, value: joinedPath, label: schemaFieldLabel || joinedPath };
			})
			: [];
		barEntries.sort((a, b) => a.label?.localeCompare(b.label) ?? 0);


		const valueEntries = Array.isArray(attributes?.value)
			? attributes.value.reduce((accumulated, pathSegments) => {
				const joinedPath = pathSegments.join('.');

				const field = model ? model.schema.getField(joinedPath) : null;
				const label = field ? game.i18n.localize(field.label) : joinedPath;
				const hint = field ? game.i18n.localize(field.hint) : null;
				accumulated.push({ group: valueGroupLabel, value: joinedPath, label, hint });
				return accumulated;
			}, [])
			: [];
		valueEntries.sort((a, b) => a.label?.localeCompare(b.label) ?? 0);

		return barEntries.concat(valueEntries);
	}
}

/* -------------------------------------------- */

/**
 * Extend the base Token class to implement additional system-specific logic.
 * @extends {Token}
 */
export class SimpleToken extends foundry.canvas.placeables.Token {
	_drawBar(number, bar, data) {
		if ('min' in data) {
			// copy data
			data = { ...data };
			// Shift the value and max by the min to draw the bar percentage accurately for a non-zero min
			data.value -= data.min;
			data.max -= data.min;
		}
		return super._drawBar(number, bar, data);
	}
}
