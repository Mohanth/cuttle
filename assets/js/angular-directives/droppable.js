app.directive('tsDroppable', function () {
	return {
		scope: {
			index: '=',
			allowDrop: '&',
			uponDrop: '&'
		},
		link: function (scope, element) {
			var el = element[0];
			var counter = 0;
			el.addEventListener('dragover', function (ev) {
				var allowDrop = scope.allowDrop();
				if (allowDrop(dragIndex, scope.index)) {
					ev.preventDefault();
				}
			}); //End dragover handler
			el.addEventListener('dragenter', function (ev) {
				ev.preventDefault(); //For IE
				var allowDrop = scope.allowDrop();
				if (allowDrop(dragIndex, scope.index)) {
					el.classList.add('dragover');
					counter++;
				}
				// console.log("dragenter. Counter: " + counter);
			});
			el.addEventListener('dragleave', function (ev) {
				var allowDrop = scope.allowDrop();
				if (allowDrop(dragIndex, scope.index)) {
					counter--;
					if (counter === 0) el.classList.remove('dragover');
				}
				// console.log("dragleave. Counter: " + counter);
			});
			el.addEventListener("drop", function (ev) {
				el.classList.remove("dragover");
				var drop = scope.uponDrop();
				drop(dragIndex, scope.index);
				counter = 0;
			}); //End drop handler
		}
	}
});