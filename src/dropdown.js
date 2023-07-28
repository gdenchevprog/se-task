(($) => {
    const DropDownList = {
        options: {
            data: [],
            slideDownDelay: 400,
            slideUpDelay: 300
        },

        init: function (element, options) {
            let wrapper;

            $.extend(this.options, options);

            this.element = element;
            element.wrap('<div class="container"></div>');

            this.wrapper = wrapper = element.closest(".container");
            wrapper.append('<span class="clear-icon"></span>');
            wrapper.append('<div class="popup"><ul class="list"></ul></div>');

            this.clearIcon = wrapper.find(".clear-icon");
            this.popup = wrapper.find(".popup");
            this.list = wrapper.find(".list");

            this.applyClassesAndAttributes();
            this.attachEventHandlers();

            this.data = this.originalData = this.wrapData(this.options.data);
            this.renderList();
        },

        applyClassesAndAttributes: function () {
            let id = this.element.attr("id");

            this.wrapper.attr("role", "application");

            this.element.addClass("dropdown-input");

            this.element.attr({
                "type": "text",
                "autocomplete": "off",
                "role": "combobox",
                "aria-autocomplete": "list",
                "aria-controls": id + "_listbox",
                "aria-expanded": false
            });

            this.list.attr({
                "role": "listbox",
                "aria-label": id + " list",
                "id": id + "_listbox"
            });
        },

        attachEventHandlers: function () {
            this.element.on("input", this._input.bind(this))
                .on("blur", this._blur.bind(this))
                .on("focus", this._focus.bind(this));

            this.clearIcon.on("click", this._clearIconClick.bind(this));

            this.popup.on("click", ".list-item", this._itemClick.bind(this));

            this.wrapper.on("keydown", this._keydown.bind(this));
        },

        wrapData: function(data) {
            return data.map(item => {
                return {
                    uid: crypto.randomUUID(),
                    value: item
                }
            });
        },

        filterData: function () {
            let data = this.originalData,
                value = this.value();

            if (value.length > 0) {
                this.data = data.filter(f => f.value.toLowerCase().includes(value.toLowerCase()));
            } else {
                this.data = data;
            }

            this.renderList();
        },

        showIcon: function (show) {
            if (show) {
                this.clearIcon.show();
            } else {
                this.clearIcon.hide();
            }
        },

        renderList: function () {
            let list = this.list,
                data = this.data,
                content = "";

            for (let i = 0; i < data.length; i++) {
                content += `<li id="${data[i].uid}" class="list-item" role="option" aria-selected="false"><span class="item-text">${data[i].value}</span></li>`;
            }

            if (content.length === 0) {
                list.html("<p>No Data</p>")
            } else {
                list.html(content);
            }
        },

        value: function (value) {
            if (value !== undefined) {
                this.element.val(value);
            }

            return this.element.val();
        },

        setFocus: function (element) {
            let elementId;
            
            if (this.focusedElement) {
                this.focusedElement.removeClass("focus");
            }

            this.focusedElement = element;
            this.focusedElement.addClass("focus");
            this.list.find("[aria-selected='true']").attr("aria-selected", false);

            if(this.liFocused()) {
                elementId = this.focusedElement.attr("id");
                this.focusedElement.attr("aria-selected", true);
                this.element.attr("aria-activedescendant", elementId);
            }
        },

        close: function () {
            this.popup.slideUp(this.options.slideDownDelay);
            this.element.attr("aria-expanded", false);
        },

        open: function () {
            this.popup.slideDown(this.options.slideUpDelay);
            this.element.attr("aria-expanded", true);
        },

        liFocused: function() {
            return this.popup.find("li.focus").length > 0;
        },

        inputFocused: function() {
            return this.focusedElement.is(this.element);
        },

        _input: function (e) {
            let input = this.element,
                value = input.val();

            if (value.length > 0) {
                this.showIcon(true);
            } else {
                this.showIcon(false);
            }

            this.value(value);
            this.setFocus(this.element);
            this.filterData();

            this.open();
        },

        _blur: function (e) {
            this.close();
        },

        _itemClick: function (e) {
            let item = $(e.target),
                value = item.text();

            this.value(value);
            this.showIcon(true);
        },

        _clearIconClick: function (e) {
            this.element.val("");
            this.showIcon(false);
        },

        _focus: function (e) {
            this.setFocus(this.element);
        },

        _keydown: function (e) {
            let keycode = e.which,
                list = this.list,
                next,
                previous,
                first = list.find("li:first"),
                last = list.find("li:last"),
                isListElementFocused = this.liFocused(),
                isInputFocused = this.inputFocused(),
                isPopupVisible = this.popup.is(":visible");

            // UP arrow
            if (keycode === 38) {
                if (isPopupVisible) {
                    if (isInputFocused) {
                        this.setFocus(last);
                        last[0].scrollIntoView();
                    } else {
                        previous = this.focusedElement.prev();
                        if (previous.length) {
                            this.setFocus(previous);
                            previous[0].scrollIntoView();
                        }
                    }
                } else {
                    this.open();
                    this.setFocus(last);
                    last[0].scrollIntoView();
                }

                e.preventDefault();
            }

            // DOWN arrow
            if (keycode === 40) {
                if (isPopupVisible) {
                    if (isInputFocused) {
                        this.setFocus(first);
                        first[0].scrollIntoView();
                    } else {
                        next = this.focusedElement.next();
                        if (next.length) {
                            this.setFocus(next);
                            next[0].scrollIntoView();
                        }
                    }
                } else {
                    this.open();
                    this.setFocus(first);
                    first[0].scrollIntoView();
                }

                e.preventDefault();
            }

            // ENTER key
            if (e.which === 13) {
                if (isListElementFocused) {
                    this.value(this.focusedElement.text());
                    this.filterData();
                    this.showIcon(true);
                }

                this.setFocus(this.element);
                this.close();

                e.preventDefault();
            }

            // ESC key
            if (e.which === 27) {
                if (isPopupVisible) {
                    if (isListElementFocused) {
                        this.setFocus(this.element);
                    }

                    this.close();
                } else {
                    this.value("");
                    this.filterData();
                    this.showIcon(false);
                }

                e.preventDefault();
            }

            // LEFT and RIGHT arrows
            if (e.which === 37 || e.which === 39) {
                if (!isInputFocused) {
                    this.setFocus(this.element);
                }
            }
        }

    }

    $.fn.DropDownList = function (options) {
        DropDownList.init(this, options);
    }

})(jQuery);