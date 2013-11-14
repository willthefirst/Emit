'use strict';

/* Factories */

angular.module('emit.factories', []).
factory('retrieveContacts', function() {

	function getGoogleContacts( callback ) {
		// Get Google contacts
		console.log('Gmail user: retrieving contacts...');

		$http({
			method: 'GET',
			url: '/user/google/contacts'
		}).
		success(function(data, status, headers, config) {
			console.log('Contacts retrieved.');
			// Strip out contacts without emails from contacts
			var split = function(val) {
				return val.split(/,\s*/);
			}

			var extractLast = function(term) {
				return split(term).pop();
			}

			// Set up autocomplete for email form
			$("#contacts").autocomplete({
				source: function(req, res) {
					// Search name and email for a match with input, and show in a custom format
					// in autocomplete. Configured for multiple variable search.

					var term = req.term;

					if (term.indexOf(', ') > 0) {
						var index = term.lastIndexOf(', ');
						term = term.substring(index + 2);
					}

					var array = [];

					var max = 10; // maximum results to display
					var j = 0;

					for (var i = 0; i < data.length; i++) {
						array.push(data[i].label + ' ' + data[i].value);
					}
					var resultsArray = [];
					var re = $.ui.autocomplete.escapeRegex(term);
					var matcher = new RegExp("\\b" + re, "i");
					var a = $.grep(array, function(item, index) {
						if (matcher.test(item) && j < max) {
							resultsArray.push(data[(array.indexOf(item))]);
							j++;
							return true;
						}
					});
					res($.ui.autocomplete.filter(resultsArray,
						extractLast(term)));
				},
				select: function(event, ui) {
					var terms = split(this.value);
					// remove the current input
					terms.pop();
					// add the selected item
					terms.push(ui.item.value);
					// add placeholder to get the comma-and-space at the end
					terms.push("");
					this.value = terms.join(", ");
					console.log(this.value);
					return false;

					// $("#contacts").val(ui.item.value);
					// return false;
				},
				open: function() {
					$('.ui-menu').width(650);
				},
				delay: 0
			}).data("ui-autocomplete")._renderItem = function(ul, item) {

				// Just display emails if there is no corresponsding first name.
				if (item.label === "") {
					return $("<li>")
						.append('<a><span class="google-contact-email-only">' + item.value + "</span></a>")
						.appendTo(ul);
				} else {
					return $("<li>")
						.append('<a><span class="google-contact-name">' + item.label + '</span><span class="google-contact-email">' + item.value + "</span></a>")
						.appendTo(ul);
				}
			};

			$scope.contacts = data;
		}).
		error(function(data, status, headers, config) {
			$scope.contacts = 'No GContact data!';
		});
	}


	// Get Facebook contacts

	return {
		talk: function() {
			console.log('Booya!!');
		},

		google: getGoogleContacts()
	}
});