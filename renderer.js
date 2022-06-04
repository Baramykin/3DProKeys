const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
// const port = new SerialPort({ path: 'COM4', baudRate: 9600 });
// const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

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
			let str = ports[i].friendlyName.indexOf('Board CDC');
			if (str === 0) {			//  && port_name != ports[i].path
				if (port_name != ports[i].path) {
					port_name = ports[i].path;
					console.log('Port_name: ', port_name, 'connected!');
					port = new SerialPort({ path: port_name, baudRate: 9600 });
					parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
					connection = 1;
					dis_connection = 1;
				}
				callback();
				return;
			}
		}
		if (dis_connection) {		
		console.log('Disconnected');
		dis_connection = 0;
		port_name = '';
		}
	});
}

function dummy() {

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
	if (connection) {
		connection = 0;
		console.log('listening on port');
		parser.on('data', function (data) {
			console.log('====================');
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
					console.log("Read mode");
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
	console.log('------');
	palce_data(layers_arr);
	bitsArray.length = 0;
}


function palce_data(data_arr) {
	console.log(data_arr.length);
	for (let i = 0; i < data_arr.length; i++) {
		console.log(data_arr[i]);
		for (let index = 0; index < data_arr[i].length; index++) {
			// console.log(data_arr[i][index]);
			let asdd = 'type_' + index;
			// console.log(asdd);
			var inputType = document.querySelector('input[name=' + asdd + ']'); // send data to input field
			inputType.value = '123';
		}
	}
	// var inputType = document.querySelector('input[name=' + asdd + ']'); // send data to input field
	// inputType.value = '123';
}




// async function listSerialPorts() {
// 	await SerialPort.list().then((ports, err) => {
// 		console.log('ports', port.path);
// 		if (ports.length === 0) {
// 			document.getElementById('error').textContent = 'No ports discovered'
// 		}
// 	});
// }





function get_layer(x) {
	// console.log('L: ', x)
	let send_data = '$READ ' + x + ';';
	console.log('Called: ', send_data);
	port.write(send_data);
}









// ENABLE ALL CHECK BOX
document.querySelectorAll('.ctrl1_all').forEach(function (element) {
	let ctrl1_all_box = document.querySelector('.ctrl1_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('.ctrl_1').forEach(function (element) {
			element.checked = ctrl1_all_box.checked;
		});
		// ctrl2_all_box.checked = false;
	});
});
document.querySelectorAll('.alt1_all').forEach(function (element) {
	let alt1_all_box = document.querySelector('.alt1_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('.alt_1').forEach(function (element) {
			element.checked = alt1_all_box.checked;
		});
	});
});
document.querySelectorAll('.shift1_all').forEach(function (element) {
	let shift1_all_box = document.querySelector('.shift1_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('.shift_1').forEach(function (element) {
			element.checked = shift1_all_box.checked;
		});
	});
});


document.querySelectorAll('.ctrl2_all').forEach(function (element) {
	let ctrl2_all_box = document.querySelector('.ctrl2_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('.ctrl_2').forEach(function (element) {
			element.checked = ctrl2_all_box.checked;
		});
	});
});
document.querySelectorAll('.alt2_all').forEach(function (element) {
	let alt2_all_box = document.querySelector('.alt2_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('.alt_2').forEach(function (element) {
			element.checked = alt2_all_box.checked;
		});
	});
});
document.querySelectorAll('.shift2_all').forEach(function (element) {
	let shift2_all_box = document.querySelector('.shift2_all[value=""]');
	element.addEventListener('click', function () {
		document.querySelectorAll('.shift_2').forEach(function (element) {
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
		this.classList.add('dropdown__button--active');
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
			dropDownBtn.classList.remove('dropdown__button--active');
			dropDownList.classList.remove('dropdown__list--visible');
		}
	});

	// press Tab or Escape key - close dropdown
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Tab' || e.key === 'Escape') {
			dropDownBtn.classList.remove('dropdown__button--active');
			dropDownList.classList.remove('dropdown__list--visible');
		}
	});
});
// END DROPDOWN LIST

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
