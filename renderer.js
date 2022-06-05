const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
// const port = new SerialPort({ path: 'COM4', baudRate: 9600 });
// const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

disable_all();

var port;
var parser;
let port_name = '';
let connection = 1;
let dis_connection = 1;

async function get_ports(subject, callback) {
	// console.log('Find ports...');
	await SerialPort.list().then((ports) => {
		if (ports.length === 0) {
			console.log('No ports discovered');
		}
		for (let i = 0; i < ports.length; i++) {
			let str = ports[i].friendlyName.indexOf('Board CDC'); // Find KeyPro device
			if (str === 0) {			//  && port_name != ports[i].path
				if (port_name != ports[i].path) {
					port_name = ports[i].path;
					console.log('Port_name: ', port_name, 'connected!');
					port = new SerialPort({ path: port_name, baudRate: 9600 });  // connecto to serialport
					parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
					connection = 1;
					dis_connection = 1;
					enable_all();
				}
				callback(); // For several execution
				return; // Exit if found device
			}
		}
		if (dis_connection) {
			console.log('Disconnected');
			dis_connection = 0;
			port_name = '';
			disable_all();
		}
	});
}


setInterval(() => {
	get_ports('', port_listener);
}, 2000);




let bitsArray = [];
var layers_arr = [
	[1, 1, 2, 3, 4, 5], [2, 1, 2, 3, 4, 5], [3, 1, 2, 3, 4, 5], [4, 1, 2, 3, 4, 5], [5, 1, 2, 3, 4, 5],
	[6, 1, 2, 3, 4, 5], [7, 1, 2, 3, 4, 5], [8, 1, 2, 3, 4, 5], [9, 1, 2, 3, 4, 5], [10, 1, 2, 3, 4, 5],
	[11, 1, 2, 3, 4, 5], [12, 1, 2, 3, 4, 5], [13, 1, 2, 3, 4, 5], [14, 1, 2, 3, 4, 5], [15, 1, 2, 3, 4, 5],
	[16, 1, 2, 3, 4, 5], [17, 1, 2, 3, 4, 5], [18, 1, 2, 3, 4, 5], [19, 1, 2, 3, 4, 5], [20, 1, 2, 3, 4, 5],
];

function port_listener() {
	if (connection) {   // If serial port name changed - then create new parcer
		connection = 0;
		// console.log('listening on port');
		parser.on('data', function (data) {
			// console.log('====================');
			var bits = data;
			bitsArray.push(bits);
			let first_l = '';
			let asd = Array.from(bitsArray); // Get first letter from Serial to detect modes	
			let temp_count = 0;
			for (const value of asd[temp_count]) {
				first_l = first_l + value;
				if (temp_count == 2) {
					break;
				}
				temp_count++;
			}

			if (first_l == 'LAY') { // If first letter is L - LAYER continue read arr from Serial
				if (bitsArray.length >= 20) {
					// console.log("Read mode");
					recived_data(bitsArray);
				}
			} else {
				bitsArray.length = 0;
			}
		});
	}
}


function recived_data(bitsArray) {
	// console.log(bitsArray.length);
	let counter_a = 0;
	let counter_b = 0;
	bitsArray.forEach((i) => { // Separate Line (LAYER 20 0 0 0 0 48) to each symbol
		let collector = [];
		let symbols = '';
		for (const value of i) {
			if (!isNaN(parseInt(value))) {
				collector.push(value);
			} else {
				for (const s of collector) {	// Join symbols				
					symbols = symbols + s;
				}
				if (!isNaN(parseInt(symbols))) { // If get no integer - wend end of cell memory
					layers_arr[counter_a][counter_b] = symbols; // Write to layer array
					counter_b++;
				}
				symbols = '';
				collector.length = 0;
			}
		}
		counter_a++;
		counter_b = 0;
	})
	// console.log('------');
	palce_data(layers_arr);
	bitsArray.length = 0;
}


function palce_data(data_arr) {   // Placing read data from device
	for (let i = 0; i < data_arr.length; i++) {
		console.log(data_arr[i]);
		type_field = data_arr[i][4]; // Get position
		let asdd = 'type_' + type_field;  // Get ASCII code
		let char = String.fromCharCode(data_arr[i][5]); //Convert ASCII code to character
		var inputType = document.querySelector('input[name=' + asdd + ']'); // Prepare for send data to input field
		inputType.value = char; // Send symbol
	}
}


function get_layer(x) {   // Send request to device. Get settings from EEPROM
	let send_data = '$READ ' + x + ';';
	port.write(send_data);
}


// SAVE BOTTOM
document.querySelector('.b-save').addEventListener('click', () => {
	let ctrl_arr = [];
	let key_arr = [];
	document.querySelectorAll('.input-key_field').forEach(function (element) {
		key_arr.push(element.value);
	});
	document.querySelectorAll('#m-key').forEach(function (element) {
		ctrl_arr.push(element.checked);
	});

	console.log(ctrl_arr);
	console.log(key_arr);

	// let first_box = document.querySelector('.alt[value="alt_2"]'); // send data to chekbox
	// first_box.checked = true;

	// var inputType = document.querySelector('input[name="type_1"]'); // send data to input field
	// inputType.value = '123';
});


// HERE INTERFACE ITERACTIONS

// ENABLE ALL CHECK BOX
document.querySelectorAll('.ctrl1_all').forEach(function (element) {
	let ctrl1_all_box = document.querySelector('.ctrl1_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('#ctrl-key').forEach(function (element) {
			element.checked = ctrl1_all_box.checked;
		});
		// ctrl2_all_box.checked = false;
	});
});
document.querySelectorAll('.alt1_all').forEach(function (element) {
	let alt1_all_box = document.querySelector('.alt1_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('#alt-key').forEach(function (element) {
			element.checked = alt1_all_box.checked;
		});
	});
});
document.querySelectorAll('.shift1_all').forEach(function (element) {
	let shift1_all_box = document.querySelector('.shift1_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('#shift-key').forEach(function (element) {
			element.checked = shift1_all_box.checked;
		});
	});
});


document.querySelectorAll('.ctrl2_all').forEach(function (element) {
	let ctrl2_all_box = document.querySelector('.ctrl2_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('#ctrl2-key').forEach(function (element) {
			element.checked = ctrl2_all_box.checked;
		});
	});
});
document.querySelectorAll('.alt2_all').forEach(function (element) {
	let alt2_all_box = document.querySelector('.alt2_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('#alt2-key').forEach(function (element) {
			element.checked = alt2_all_box.checked;
		});
	});
});
document.querySelectorAll('.shift2_all').forEach(function (element) {
	let shift2_all_box = document.querySelector('.shift2_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('#shift2-key').forEach(function (element) {
			element.checked = shift2_all_box.checked;
		});
	});
});



// START DROPDOWN LIST
// Find  forEach for NodeList
if (window.NodeList && !NodeList.prototype.forEach) {
	NodeList.prototype.forEach = function (callback, thisArg) {
		thisArg = thisArg || window;
		for (var i = 0; i < this.length; i++) {
			callback.call(thisArg, this[i], i, this);
		}
	};
}

document.querySelectorAll('.dropdown').forEach(function (dropDownWrapper) {
	const dropDownBtn = dropDownWrapper.querySelector('.dropdown__button');
	const dropDownList = dropDownWrapper.querySelector('.dropdown__list');
	const dropDownListItems = dropDownList.querySelectorAll('.dropdown__list-item');
	const dropDownInput = dropDownWrapper.querySelector('.dropdown__input-hidden');

	// Click Open/Close select
	dropDownBtn.addEventListener('click', function (e) {
		dropDownList.classList.toggle('dropdown__list--visible');
		// this.classList.add('dropdown__button--active');
	});

	// Select form lis. remember value. Close dropdown
	dropDownListItems.forEach(function (listItem) {
		listItem.addEventListener('click', function (e) {
			e.stopPropagation();
			dropDownBtn.innerText = this.innerText;
			dropDownBtn.focus();
			dropDownInput.value = this.dataset.value;
			dropDownList.classList.remove('dropdown__list--visible');
			// console.log(dropDownInput.value);
		});
	});

	// If clicked out - close dropdown
	document.addEventListener('click', function (e) {
		if (e.target !== dropDownBtn) {
			// dropDownBtn.classList.remove('dropdown__button--active');
			dropDownList.classList.remove('dropdown__list--visible');
		}
	});

	// press Tab or Escape key - close dropdown
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Tab' || e.key === 'Escape') {
			// dropDownBtn.classList.remove('dropdown__button--active');
			dropDownList.classList.remove('dropdown__list--visible');
		}
	});
});
// END DROPDOWN LIST


function disable_all() {
	document.querySelectorAll('#state, #ctrl-key, #alt-key, #shift-key, #new_key, .dropdown__button, #enable_all, #ctrl2-key, #alt2-key, #shift2-key').forEach(function (element) {
		element.checked = false;
		element.value = '';
		element.setAttribute("disabled", "");
	});
	document.querySelector('#save_btn').setAttribute("disabled", "");

	document.querySelector('.dropdown__button').innerHTML = 'Select';

	document.querySelectorAll('.top-title').forEach(function (element) {
		element.classList.remove('top-title');
		element.classList.add('top-title-disabled');
	});
	document.querySelector('#status').innerHTML = 'Disconnected';
}


function enable_all() {
	document.querySelectorAll('#state, #ctrl-key, #alt-key, #shift-key, #new_key, .dropdown__button, #enable_all, #ctrl2-key, #alt2-key, #shift2-key').forEach(function (element) {
		element.removeAttribute("disabled", "");
	});
	document.querySelector('#save_btn').removeAttribute("disabled", "");

	document.querySelector('.dropdown__button').innerHTML = 'Select';

	document.querySelectorAll('.top-title-disabled').forEach(function (element) {
		element.classList.remove('top-title-disabled');
		element.classList.add('top-title');
	});

	document.querySelector('#status').innerHTML = 'Connected';
}