export function attachSelectOptions(id, onChange) {
	const select = document.getElementById(id);
	if (!select) return console.error(`missing id: ${id}`);

	const selectSelected = select.querySelector('.selected');
	const selectItems = select.querySelector('.options');
	const options = selectItems.querySelectorAll('li');

	selectSelected.addEventListener('click', function () {
		if (selectItems.classList.contains('show')) {
			selectItems.classList.remove('show');
		} else {
			selectItems.classList.add('show');
		}
	});

	options.forEach(function (option) {
		option.addEventListener('click', function () {
			// TODO Look up the proper value in the translation
			selectSelected.textContent = option.textContent;
			selectItems.classList.remove('show');
			onChange(option.dataset.value);
		});
	});

	window.addEventListener('click', function (e) {
		if (!select.contains(e.target)) {
			selectItems.classList.remove('show');
		}
	});
}
