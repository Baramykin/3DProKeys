// KEY PAD PRO V1 PRERELISE
// START DATE: 9.05.2022
// AUTOR: BARAMYKIN VIKTOR
// LAST UPDATE: 7.06.2022

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
// const port = new SerialPort({ path: 'COM4', baudRate: 9600 });
// const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

var port;
var parser;
let port_name = '';
let connection = 1;
let dis_connection = 1;
let selected_layer = 0;

disable_all();

async function get_ports(subject, callback) {
	await SerialPort.list().then((ports) => {
		// console.log('Find ports...', ports);
		if (ports.length === 0) {
			//console.log('No ports discovered');
		}
		for (let i = 0; i < ports.length; i++) {
			// let str = ports[i].friendlyName.indexOf('Board CDC'); // Find KeyPro device
			// if (str === 0) {			//  && port_name != ports[i].path
			// Find raspberry Pi Pico: serialNumber: 16 symbols; vendorId: 2E8A; productId: 800A
			if (ports[i].vendorId === '2E8A' && ports[i].serialNumber.length === 16 && ports[i].productId === '800A') {
				if (port_name != ports[i].path) {
					port_name = ports[i].path;
					//console.log('Port_name: ', port_name, 'connected!');
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
			//console.log('Disconnected');
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
		//console.log('listening on port');
		parser.on('data', function (data) {
			//console.log('> ', data);
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
					//console.log("Read mode");
					recived_data(bitsArray);
				}
			} else {
				bitsArray.length = 0;
			}
		});
	}
}


function recived_data(bitsArray) {
	//console.log(bitsArray.length);
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
	//console.log('------');
	palce_data(layers_arr);
	bitsArray.length = 0;
}

let name_arr = ['ESC', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
	'DELETE', 'HOME', 'END', 'PAGE_UP', 'PAGE_DOWN',
	'UP_ARROW', 'DOWN_ARROW', 'LEFT_ARROW', 'RIGHT_ARROW', 'C_LOCK', 'BACKSPACE', 'ENTER', 'MENU', 'TAB',
	'L_CTRL', 'L_SHIFT', 'L_ALT', 'L_GUI', 'R_CTRL', 'R_SHIFT', 'R_ALT', 'R_GUI'];
let code_arr = [177, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205,
	212, 210, 213, 211, 214, 218, 217, 216, 215, 193, 178, 176, 237, 179,
	128, 129, 130, 131, 132, 133, 134, 135];

let notation = '';
for (let i = 0; i < name_arr.length; i++) {
	notation = notation + name_arr[i] + ',    ';
}
document.querySelector('#notation1').innerHTML = notation.substring(0, notation.length - 5); // Output name_arr to HTML and remove las ,symbol

function palce_data(data_arr) {   // Placing read data from device
	let char = '';
	for (let i = 0; i < data_arr.length; i++) {
		//console.log(data_arr[i]);
		type_field = data_arr[i][4]; // Get position
		if (type_field > 19) {
			error_device();
			break;
		}
		let asdd = 'type_' + type_field;  // Get ASCII code
		if (code_arr.indexOf(+data_arr[i][5]) >= 0) {
			//console.log(data_arr[i][5], ' ', code_arr.indexOf(+data_arr[i][5]));
			char = name_arr[code_arr.indexOf(+data_arr[i][5])];
			//console.log(char);
		} else {
			char = String.fromCharCode(data_arr[i][5]); //Convert ASCII code to character
		}
		var inputType = document.querySelector('input[name=' + asdd + ']'); // Prepare for send data to input field
		//console.log(data_arr.length);
		inputType.value = char; // Send symbol
		//console.log(i, ' ', data_arr[i][1], data_arr[i][2], data_arr[i][3]);
		// Setup checkboxes
		var ctrl_bool = 0; (data_arr[i][1] > 0) ? ctrl_bool = 1 : ctrl_bool = 0;
		var alt_bool = 0; (data_arr[i][2] > 0) ? alt_bool = 1 : alt_bool = 0;
		var shift_bool = 0; (data_arr[i][3] > 0) ? shift_bool = 1 : shift_bool = 0;
		document.querySelector('.ctrl_' + i).checked = ctrl_bool;
		document.querySelector('.alt_' + i).checked = alt_bool;
		document.querySelector('.shift_' + i).checked = shift_bool;
	}
}


function get_layer(x) {   // Send request to device. Get settings from EEPROM
	let send_data = '$READ ' + x + ';';
	port.write(send_data);
}


// SAVE BOTTOM
document.querySelector('.b-save').addEventListener('click', () => {
	document.querySelector('.b-save').setAttribute("disabled", ""); // disable button when save data
	let ctrl_arr = [];
	let alt_arr = [];
	let shift_arr = [];
	let key_arr = [];
	document.querySelectorAll('.input-key_field').forEach(function (element) {
		key_arr.push(element.value);
	});
	document.querySelectorAll('#ctrl-key, #ctrl2-key').forEach(function (element) {
		ctrl_arr.push(element.checked);
	});
	document.querySelectorAll('#alt-key, #alt2-key').forEach(function (element) {
		alt_arr.push(element.checked);
	});
	document.querySelectorAll('#shift-key, #shift2-key').forEach(function (element) {
		shift_arr.push(element.checked);
	});
	//console.log(key_arr);
	let prefix = '$WRITE';
	let end_line = ';';
	for (let i = 0; i < ctrl_arr.length; i++) {
		let layer = i;
		let ctrl = 0; (ctrl_arr[i]) ? ctrl = 128 : ctrl = 0;
		let alt = 0; (alt_arr[i]) ? alt = 130 : alt = 0;
		let shift = 0; (shift_arr[i]) ? shift = 129 : shift = 0;
		let key = 0;
		if (key_arr[i].length >= 2) {
			let index = name_arr.indexOf(key_arr[i]);
			//console.log(key_arr[i], ' ', key_arr[i].length, ' ', code_arr[index]);
			key = code_arr[index];

		} else {
			key = key_arr[i].charCodeAt(0);
		}
		write_ine = prefix + ' ' + selected_layer + ' ' + ctrl + ' ' + alt + ' ' + shift + ' ' + i + ' ' + key + end_line;
		//console.log(write_ine);
		port.write(write_ine);
	}
	get_layer(selected_layer);
	//console.log('Layer done: ', selected_layer);
	document.querySelector('.b-save').removeAttribute("disabled", ""); // enable button when saved data done
});


// HERE INTERFACE ITERACTIONS
// ENABLE ALL CHECK BOX
document.querySelectorAll('.ctrl1_all').forEach(function (element) {
	let ctrl1_all_box = false; // document.querySelector('.ctrl1_all[value=""]');
	element.addEventListener('click', function () {
		ctrl1_all_box = !ctrl1_all_box;
		document.querySelectorAll('#ctrl-key').forEach(function (element) {
			element.checked = ctrl1_all_box; //.checked;
		});
		document.querySelector('.ctrl1_all').checked = false;
	});
});
document.querySelectorAll('.alt1_all').forEach(function (element) {
	let alt1_all_box = false;
	element.addEventListener('click', function () {
		alt1_all_box = !alt1_all_box;
		document.querySelectorAll('#alt-key').forEach(function (element) {
			element.checked = alt1_all_box;
		});
		document.querySelector('.alt1_all').checked = false;
	});
});
document.querySelectorAll('.shift1_all').forEach(function (element) {
	let shift1_all_box = false;
	element.addEventListener('click', function () {
		shift1_all_box = !shift1_all_box;
		document.querySelectorAll('#shift-key').forEach(function (element) {
			element.checked = shift1_all_box;
		});
		document.querySelector('.shift1_all').checked = false;
	});
});
document.querySelectorAll('.ctrl2_all').forEach(function (element) {
	let ctrl2_all_box = false;
	element.addEventListener('click', function () {
		ctrl2_all_box = !ctrl2_all_box;
		document.querySelectorAll('#ctrl2-key').forEach(function (element) {
			element.checked = ctrl2_all_box; //.checked;
		});
		document.querySelector('.ctrl2_all').checked = false;
	});
});
document.querySelectorAll('.alt2_all').forEach(function (element) {
	let alt2_all_box = false;
	element.addEventListener('click', function () {
		alt2_all_box = !alt2_all_box;
		document.querySelectorAll('#alt2-key').forEach(function (element) {
			element.checked = alt2_all_box;
		});
		document.querySelector('.alt2_all').checked = false;
	});
});
document.querySelectorAll('.shift2_all').forEach(function (element) {
	let shift2_all_box = false;
	element.addEventListener('click', function () {
		shift2_all_box = !shift2_all_box;
		document.querySelectorAll('#shift2-key').forEach(function (element) {
			element.checked = shift2_all_box;
		});
		document.querySelector('.shift2_all').checked = false;
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
			selected_layer = dropDownBtn.innerText;
			document.querySelector('#save_btn').removeAttribute("disabled", "");  //Enable Seve button
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
	selected_layer = 0; // Reset selected layer
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
	document.querySelector('#status').innerHTML = 'Status: disconnected';
	document.querySelector('.reset_btn').setAttribute("disabled", "");
	document.querySelectorAll('.dropdown').forEach(function (dropDownWrapper) { // Close dropdown menu when disconnected
		dropDownWrapper.querySelector('.dropdown__list').classList.remove('dropdown__list--visible');
	});
}


function enable_all() {
	document.querySelectorAll('#state, #ctrl-key, #alt-key, #shift-key, #new_key, .dropdown__button, #enable_all, #ctrl2-key, #alt2-key, #shift2-key').forEach(function (element) {
		element.removeAttribute("disabled", "");
	});
	document.querySelector('.dropdown__button').innerHTML = 'Select';
	document.querySelectorAll('.top-title-disabled').forEach(function (element) {
		element.classList.remove('top-title-disabled');
		element.classList.add('top-title');
	});
	document.querySelector('#status').innerHTML = 'Status: connected';
	document.querySelector('.reset_btn').removeAttribute("disabled", "");
}


function error_device() {
	disable_all();
	//console.log('Reser device, please');
	document.querySelector('.reset_btn').removeAttribute("disabled", "");  //Activate Reset button
	return;
}


function reset_device() {
	port.write('$DEFAULT;');
}