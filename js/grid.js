(function($) {
    $.widget("ui.grid", {
        options: {
        	columns: [],
            method: 'GET',
            parameters: { offset: 0, limit: 25},
            autoLoad: false,
            paging: false,
            dataProperty: 'data',
            totalProperty: 'total',
            summaryProperty: 'summary',
            dataTypeName: 'item',
            dataTypePluralName: 'items',
            currencyCode: 'USD',
            summaryClass: 'summary',
            noDataClass: 'noData',
            classPrefix: 'grid'
        },
        sortColumn: null,
        sortDirection: 'asc',
        filters: {},
        limit: null,
        offset: null,
        records: [],
        columnSummary: [],
        total: 0,
        thousandSeparator: ',',
        
        _create: function() {
            var self = this;
            
            /* set sorting, paging and filter variables if passed in */
            if(!self._isEmpty(self.options.parameters.sortColumn)) {
            	self.sortColumn = self.options.parameters.sortColumn;
            }
            
            if(!self._isEmpty(self.options.parameters.sortDirection)) {
            	self.sortDirection = self.options.parameters.sortDirection;
            }
            
            if(!self._isEmpty(self.options.parameters.filters)) {
            	self.filters = self.options.parameters.filters;
            }
            
            if(self.options.paging) {
	            if(!self._isEmpty(self.options.parameters.limit)) {
	            	self.limit = self.options.parameters.limit;
	            }
	            
	            if(!self._isEmpty(self.options.parameters.offset)) {
	            	self.offset = self.options.parameters.offset;
	            }	            
            }
            
            if(self.options.autoLoad) {
            	/* load records and render table */
            	self.load();
            }
            else {
            	/* render empty table */
                self._render();
            }
            
            return self;
        },
        
        setFilter: function(name, value) {
        	this.filters[name] = value;
        },
        
        setSortColumn: function(column) {
        	this.sortColumn = column;
        },
        
        setSortDirection: function(direction) {
        	this.sortDirection = direction;
        },
        
        load: function() {
        	var self = this;
        	
        	$('body').css('cursor', 'wait');
        	
        	var data = {};
    		
        	if(!self._isEmpty(self.sortColumn)) {
        		data.sortColumn = self.sortColumn;
                if(!self._isEmpty(self.sortDirection)) {
                    data.sortDirection = self.sortDirection;
                }
        	}
        	
        	
        	if(self.options.paging) {
	        	if(!self._isEmpty(self.offset)) {
	        		data.offset = self.offset;
	        	}
	        	if(!self._isEmpty(self.limit)) {
	        		data.limit = self.limit;
	        	}
        	}
        	
    		//data.filters = $.param(self.filters);
        	$.each(self.filters, function(k, v) {
        		if(!self._isEmpty(v)) {
        			data[k] = v;
        		}
        	});

            self.element.trigger('beforequery');

            $.ajax({
        		url: self.options.url,
        		type: self.options.method,
        		data: data,
        		dataType: 'json',
        		success: function(response) {
        			self._trigger('afterload');
        			
        			/* store total and records */
        			self.records = response[self.options.dataProperty];
        			self.total = response[self.options.totalProperty];
        			self.summary = response[self.options.summaryProperty];
        			
        			/* render table */
                    self._render();
                                        
                    $('body').css('cursor', 'default');
        		}
        	});
        },
        
        _renderValue: function(record, column, value) {
        	var self = this;
        	
        	/* check for special formatting */
			if(column.useThousandSeparator) {
				value = self._addThousandSeparator(value);
			}
			if(!self._isEmpty(column.precision)) {
				value = value.toFixed(column.precision);
			}
			
			/* format value by type */					
			value = self._formatValue(value, column.type);
			
			/* if renderer defined */
  			if(column.renderer != undefined) {
  				/* call renderer with value */
  				value = column.renderer(record, value);
  			}
			
  			/* replace null values with empty string */
			value = (self._isEmpty(value) ? '' : value);
			
			return value;
        },
        
        _render: function() {
        	var self = this;

        	/* add default class */
        	this.element.addClass(self.options.classPrefix);
        	        	
        	/* build table header */
            var thead = '<thead><tr>';
            $.each(self.options.columns, function(i, column) {
            	var sortIndicator = '';            	
            	var sortClass = '';
            	if(self._isEmpty(column.sortable) || column.sortable) {
            		/* determine sort direction */
	            	if(self.sortColumn == column.index) {
	            		if(self.sortDirection == 'asc') {
	            			sortIndicator = '&#9650;';
	            		}
	            		else {
	            			sortIndicator = '&#9660;';
	            		}	            		
	            	}
	            	sortIndicator = '&nbsp;' + sortIndicator;
	            	sortClass = 'sortable';
				}
            	thead += '<th data-index="' + column.index + '" class="' + sortClass + (self._isEmpty(column.cls) ? '' : ' ' + column.cls) +'">' + (self._isEmpty(column.label) ? '' : column.label) + sortIndicator + '</th>';
			});
            thead += '</tr></thead>';
            
            /* build table body */
            var tbody = '<tbody>';
            if(self.total == 0) {
            	tbody += '<tr' + ' class="' + self.options.noDataClass + '"><td style="text-align:center;" colspan="' + self.options.columns.length + '">No ' + self.options.dataTypePluralName +  ' found</td></tr>';
            }
            else {
	            $.each(self.records, function(i, record) {
					tbody += '<tr>';
					
					$.each(self.options.columns, function(j, column) {
						var rawValue = self._getNestedProperty(record, column.index);
						var value = self._renderValue(record, column, rawValue);
						
						tbody += '<td data-index="' + column.index + '"' + self._buildClassAttr(column.cls) + '>' + value + '</td>';
					});
					
					tbody += '</tr>';
				});
            }
            tbody += '</tbody>';
            
            /* build paging */
            var paging = '';
            if(self.options.paging) {
	            paging += '<div class="pagination"><ul>';
	            
	            if(self.offset - self.limit < 0) {
	            	paging += '<li class="disabled"><a href="#"><i class="icon-fast-backward"></i></a></li>';
	            	paging += '<li class="disabled"><a href="#"><i class="icon-step-backward"></i></a></li>';
	            }
	            else {
	            	paging += '<li><a href="#" data-offset="0"><i class="icon-fast-backward"></i></a></li>';
	            	paging += '<li><a href="#" data-offset="' + (self.offset - self.limit) + '"><i class="icon-step-backward"></i></a></li>';
	            }
	            
	            if(self.offset + self.limit >= self.total) {
		            paging += '<li class="disabled"><a href="#"><i class="icon-step-forward"></i></a></li>';
		            paging += '<li class="disabled"><a href="#"><i class="icon-fast-forward"></i></a></li>';
	            }
	            else {
	            	paging += '<li><a href="#" data-offset="' + (self.offset + self.limit) + '"><i class="icon-step-forward"></i></a></li>';
		            paging += '<li><a href="#" data-offset="' + ((self.total % self.limit) == 0 ? (self.total - self.limit) : (self.total - (self.total % self.limit))) + '"><i class="icon-fast-forward"></i></a></li>';
	            }
	            
	            paging += '</ul></div>';
            }
            
            /* build table footer */
            var tfoot = '<tfoot><tr><td colspan="' + self.options.columns.length + '">'; 
            var from = (self.total == 0 ? 0 : self.offset + 1);
            var to;
            if(self.options.paging) {
                to = (self.offset + self.limit > self.total ? self.total : self.offset + self.limit);
            } 
            else {
                to = self.total;
            }
            tfoot += '<div style="float:right;margin-top:auto; margin-bottom:auto;">Displaying ' + from + ' - ' + to + ' of ' + self.total +  '</div>';
            tfoot += '<div>' + paging + '</div>';
            tfoot += '</td></tr></tfoot>';
            
            /* render table */
            self.element.html(thead + tbody + tfoot);
                        
            ///* enable column sorting (except for id column) */
            //self.element.find('thead th.sortable').not('thead th[data-index="id"]').on('click', function() {
            /* enable column sorting (except for id column) */
            self.element.find('thead th.sortable').on('click', function() {
        		var sortDirection = 'asc';
        		var sortColumn = $(this).data('index');
        		
        		/* toggle sort direction */
        		if(self.sortColumn == sortColumn && self.sortDirection == 'asc') {
        			sortDirection = 'desc';
        		}
        		self.sortColumn = sortColumn;
        		self.sortDirection = sortDirection;
        		
        		/* reload records */
            	self.load();
        	});
            
            /* enable paging toolbar */
            if(self.options.paging) {
            	$('.pagination a').unbind().click(function(e) {
            		e.preventDefault(); 
            		var offset = $(this).data('offset');                	
                	if(!self._isEmpty(offset) && !self._isEmpty(self.limit)) {
                		self.offset = offset;
                		self.load();
                	}
            	});            	
            }
            
            if(!self._isEmpty(self.summary)) {
	            var summary = '<tr class="'+ self.options.summaryClass +'">';
	            var value;
				$.each(self.options.columns, function(index, column) {
					if(!self._isEmpty(self.summary[column.index])) {
						value = self._renderValue(summary, column, self.summary[column.index]);
					}
					
					/* replace null values with empty string */
					value = (self._isEmpty(value) ? '' : value);
					summary += '<td' + self._buildClassAttr(column.cls) + '>' + value + '</td>';					
				});
			
				summary += '</tr>';
				self.element.find('tbody tr:last').after(summary);
            }
            self.element.trigger('afterrender');
        },
        
        _buildClassAttr: function(cls) {
        	var clsAttr = '';
			if(!this._isEmpty(cls)) { 
				clsAttr = ' class="' + cls + '"';
			}
			return clsAttr;
        },
        
        _formatValue: function(value, type) {
        	var self = this;
        	
        	if(type == 'currency') {
				value = self._toCurrency(value);
			}
			else if(type == 'date') {
				value = new Date(value).toDateString();
			}
			else if(type == 'email') {
				value = '<a href="mailto:' + value + '">' + value + "</a>";
			}
        	
        	return value;
        },
        
        _isEmpty: function(item) {
        	if(item == undefined) {
        		return true;
        	}
        	if(item == null) {
        		return true;
        	}
        	if(item === '') {
        		return true;
        	}
        	return false;
        },
        
        _addThousandSeparator:  function(val) {
		    var self = this;        	
        	val += '';
		    x = val.split('.');
		    x1 = x[0];
		    x2 = x.length > 1 ? '.' + x[1] : '';
		    var rgx = /(\d+)(\d{3})/;
		    while (rgx.test(x1)) {
		        x1 = x1.replace(rgx, '$1' + self.thousandSeparator + '$2');
		    }
		    return x1 + x2;
		},
	
		_toCurrency: function (num) {
			var self = this;
			
			if(self._isEmpty(num)) {
				num = 0;
			}
			
			num = parseFloat(num);
			
			if(self.options.currencyCode == 'USD') {
				return '$' + this._addThousandSeparator(num.toFixed(2));
			}
				
			// TODO: handle other currency codes
			
		},
        
        _getNestedProperty: function(obj, property) {
        	if(this._isEmpty(property)) { return null; }
        	var arr = property.split(".");
    	    while(arr.length && (obj = obj[arr.shift()]));
    	    return obj;
        },
        
        destroy: function() {
        	$.Widget.prototype.destroy.call(this);
        },

        _setOption: function(option, value) {
            $.Widget.prototype._setOption.apply(this, arguments);
        }
    });
})(jQuery);
