class PrettyTOCHandler extends elementorModules.frontend.handlers.Base {

    getDefaultSettings() {
        var elementSettings = this.getElementSettings(),
            listWrapperTag = 'numbers' === elementSettings.marker_view ? 'ol' : 'ul';
        return {
            selectors: {
                widgetContainer: '.elementor-widget-container',
                postContentContainer: '.elementor:not([data-elementor-type="header"]):not([data-elementor-type="footer"]):not([data-elementor-type="popup"])',
                expandButton: '.elementor-toc__toggle-button--expand',
                collapseButton: '.elementor-toc__toggle-button--collapse',
                body: '.elementor-toc__body',
                headerTitle: '.elementor-toc__header-title'
            },
            classes: {
                anchor: 'elementor-menu-anchor',
                listWrapper: 'elementor-toc__list-wrapper',
                listItem: 'elementor-toc__list-item',
                listTextWrapper: 'elementor-toc__list-item-text-wrapper',
                firstLevelListItem: 'elementor-toc__top-level',
                listItemText: 'elementor-toc__list-item-text',
                activeItem: 'elementor-item-active',
                headingAnchor: 'elementor-toc__heading-anchor',
                collapsed: 'elementor-toc--collapsed'
            },
            listWrapperTag: listWrapperTag
        };
    }

    getDefaultElements() {
        var settings = this.getSettings();
        return {
            $pageContainer: this.getContainer(),
            $widgetContainer: this.$element.find(settings.selectors.widgetContainer),
            $expandButton: this.$element.find(settings.selectors.expandButton),
            $collapseButton: this.$element.find(settings.selectors.collapseButton),
            $tocBody: this.$element.find(settings.selectors.body),
            $listItems: this.$element.find('.' + settings.classes.listItem)
        };
    }

    getContainer() {
        var settings = this.getSettings(),
            elementSettings = this.getElementSettings(); // If there is a custom container defined by the user, use it as the headings-scan container

        if (elementSettings.container) {
            return jQuery(elementSettings.container);
        } // Get the document wrapper element in which the TOC is located


        var $documentWrapper = this.$element.parents('.elementor'); // If the TOC container is a popup, only scan the popup for headings

        if ('popup' === $documentWrapper.attr('data-elementor-type')) {
            return $documentWrapper;
        } // If the TOC container is anything other than a popup, scan only the post/page content for headings


        return jQuery(settings.selectors.postContentContainer);
    }
    bindEvents() {
        var _this = this;

        var elementSettings = this.getElementSettings();

        if (elementSettings.minimize_box) {
            this.elements.$expandButton.on('click', function () {
                return _this.expandBox();
            });
            this.elements.$collapseButton.on('click', function () {
                return _this.collapseBox();
            });
        }

        if (elementSettings.collapse_subitems) {
            this.elements.$listItems.hover(function (event) {
                return jQuery(event.target).slideToggle();
            });
        }
    }
    getHeadings() {
        // Get all headings from document by user-selected tags
        var elementSettings = this.getElementSettings(),
            tags = elementSettings.headings_by_tags.join(','),
            selectors = this.getSettings('selectors'),
            excludedSelectors = elementSettings.exclude_headings_by_selector;
        return this.elements.$pageContainer.find(tags).not(selectors.headerTitle).filter(function (index, heading) {
            return !jQuery(heading).closest(excludedSelectors).length; // Handle excluded selectors if there are any
        });
    }
    addAnchorsBeforeHeadings() {
        // Add an anchor element right before each TOC heading to create anchors for TOC links
        var classes = this.getSettings('classes');
        var elementSettings = this.getElementSettings();
        this.elements.$headings.before(function (index) {
            if (elementSettings.duplicate_anchor_fix == 'yes') {
                var anchorText = this.textContent.replace(/\s+/g, '-').replace(/[^\w-]+/g,'').toLowerCase() + '-' + index;
            } else {
                var anchorText = this.textContent.replace(/\s+/g, '-').replace(/[^\w-]+/g,'').toLowerCase();
            }
            return "<span id=\"".concat(anchorText, "\" class=\"").concat(classes.anchor, " \"></span>");
        });
    }

    activateItem($listItem) {

        var classes = this.getSettings('classes');
        this.deactivateActiveItem($listItem);
        $listItem.addClass(classes.activeItem);
        this.$activeItem = $listItem;

        if (!this.getElementSettings('collapse_subitems')) {
            return;
        }

        var $activeList;

        if ($listItem.hasClass(classes.firstLevelListItem)) {
            $activeList = $listItem.parent().next();
        } else {
            $activeList = $listItem.parents('.' + classes.listWrapper).eq(-2);
        }

        if (!$activeList.length) {
            delete this.$activeList;
            return;
        }

        this.$activeList = $activeList;
        this.$activeList.stop().slideDown();
    }

    deactivateActiveItem($activeToBe) {
        if (!this.$activeItem || this.$activeItem.is($activeToBe)) {
            return;
        }

        var _this$getSettings = this.getSettings(),
            classes = _this$getSettings.classes;

        this.$activeItem.removeClass(classes.activeItem);

        if (this.$activeList && (!$activeToBe || !this.$activeList[0].contains($activeToBe[0]))) {
            this.$activeList.slideUp();
        }
    }

    followAnchor($element, index) {        
        var _this2 = this;

        var anchorSelector = $element[0].hash;
        var $anchor;

        try {
            // `decodeURIComponent` for UTF8 characters in the hash.
            $anchor = jQuery(decodeURIComponent(anchorSelector));
        } catch (e) {
            return;
        }

        elementorFrontend.waypoint($anchor, function (direction) {
            if (_this2.itemClicked) {
                return;
            }

            var id = $anchor.attr('id');

            if ('down' === direction) {
                _this2.viewportItems[id] = true;

                _this2.activateItem($element);
            } else {
                delete _this2.viewportItems[id];

                _this2.activateItem(_this2.$listItemTexts.eq(index - 1));
            }
        }, {
            offset: 'bottom-in-view',
            triggerOnce: false
        });
        elementorFrontend.waypoint($anchor, function (direction) {
            if (_this2.itemClicked) {
                return;
            }

            var id = $anchor.attr('id');

            if ('down' === direction) {
                delete _this2.viewportItems[id];

                if (Object.keys(_this2.viewportItems).length) {
                    _this2.activateItem(_this2.$listItemTexts.eq(index + 1));
                }
            } else {
                _this2.viewportItems[id] = true;

                _this2.activateItem($element);
            }
        }, {
            offset: 0,
            triggerOnce: false
        });
    }

    followAnchors() {
        var _this3 = this;

        this.$listItemTexts.each(function (index, element) {
            return _this3.followAnchor(jQuery(element), index);
        });
    }

    populateTOC() {
        this.listItemPointer = 0;
        var elementSettings = this.getElementSettings();

        if (elementSettings.hierarchical_view) {
            this.createNestedList();
        } else {
            this.createFlatList();
        }

        this.$listItemTexts = this.$element.find('.elementor-toc__list-item-text');
        this.$listItemTexts.on('click', this.onListItemClick.bind(this));

        if (!elementorFrontend.isEditMode()) {
            this.followAnchors();
        }
    }

    createNestedList() {
        var _this4 = this;

        this.headingsData.forEach(function (heading, index) {
            heading.level = 0;

            for (var i = index - 1; i >= 0; i--) {
                var currentOrderedItem = _this4.headingsData[i];

                if (currentOrderedItem.tag <= heading.tag) {
                    heading.level = currentOrderedItem.level;

                    if (currentOrderedItem.tag < heading.tag) {
                        heading.level++;
                    }

                    break;
                }
            }
        });
        this.elements.$tocBody.html(this.getNestedLevel(0));
    }

    createFlatList() {
        this.elements.$tocBody.html(this.getNestedLevel());
    }

    getNestedLevel(level) {
        var settings = this.getSettings(),
            elementSettings = this.getElementSettings(),
            icon = this.getElementSettings('icon'); // Open new list/nested list

        var html = "<".concat(settings.listWrapperTag, " class=\"").concat(settings.classes.listWrapper, "\">"); // for each list item, build its markup.

        while (this.listItemPointer < this.headingsData.length) {
            var currentItem = this.headingsData[this.listItemPointer];
            var listItemTextClasses = settings.classes.listItemText;

            if (0 === currentItem.level) {
                // If the current list item is a top level item, give it the first level class
                listItemTextClasses += ' ' + settings.classes.firstLevelListItem;
            }

            if (level > currentItem.level) {
                break;
            }

            if (level === currentItem.level) {
                html += "<li class=\"".concat(settings.classes.listItem, "\">");
                html += "<div class=\"".concat(settings.classes.listTextWrapper, "\">");
                if (elementSettings.duplicate_anchor_fix == 'yes') {
                    var anchorText = currentItem.text.replace(/\s+/g, '-').replace(/[^\w-]+/g,'').toLowerCase() + '-' + this.listItemPointer;
                } else {
                    var anchorText = currentItem.text.replace(/\s+/g, '-').replace(/[^\w-]+/g,'').toLowerCase();
                }
                
                var liContent = "<a href=\"#".concat(anchorText, "\" class=\"").concat(listItemTextClasses, "\">").concat(currentItem.text, "</a>"); // If list type is bullets, add the bullet icon as an <i> tag

                if ('bullets' === elementSettings.marker_view && icon) {
                    liContent = "<i class=\"".concat(icon.value, "\"></i>").concat(liContent);
                }

                html += liContent;
                html += '</div>';
                this.listItemPointer++;
                var nextItem = this.headingsData[this.listItemPointer];

                if (nextItem && level < nextItem.level) {
                    // If a new nested list has to be created under the current item,
                    // this entire method is called recursively (outside the while loop, a list wrapper is created)
                    html += this.getNestedLevel(nextItem.level);
                }

                html += '</li>';
            }
        }

        html += "</".concat(settings.listWrapperTag, ">");
        return html;
    }
    handleNoHeadingsFound() {
        var noHeadingsText = elementorProFrontend.config.i18n['toc_no_headings_found'];

        if (elementorFrontend.isEditMode()) {
            noHeadingsText = elementorPro.translate('toc_no_headings_found');
        }

        return this.elements.$tocBody.html(noHeadingsText);
    }
    collapseOnInit() {
        var minimizedOn = this.getElementSettings('minimized_on'),
            currentDeviceMode = elementorFrontend.getCurrentDeviceMode();

        if ('tablet' === minimizedOn && 'desktop' !== currentDeviceMode || 'mobile' === minimizedOn && 'mobile' === currentDeviceMode) {
            this.collapseBox();
        }
    }
    setHeadingsData() {
        var _this5 = this;

        this.headingsData = []; // Create an array for simplifying TOC list creation

        this.elements.$headings.each(function (index, element) {
            _this5.headingsData.push({
                tag: +element.nodeName.slice(1),
                text: element.textContent
            });
        });
    }
    run() {
        this.elements.$headings = this.getHeadings();

        if (!this.elements.$headings.length) {
            return this.handleNoHeadingsFound();
        }

        this.setHeadingsData();

        if (!elementorFrontend.isEditMode()) {
            this.addAnchorsBeforeHeadings();
        }

        this.populateTOC();

        if (this.getElementSettings('minimize_box')) {
            this.collapseOnInit();
        }
    }
    expandBox() {
        var boxHeight = this.getCurrentDeviceSetting('min_height');
        this.$element.removeClass(this.getSettings('classes.collapsed'));
        this.elements.$tocBody.slideDown(); // return container to the full height in case a min-height is defined by the user

        this.elements.$widgetContainer.css('min-height', boxHeight.size + boxHeight.unit);
    }
    collapseBox() {
        this.$element.addClass(this.getSettings('classes.collapsed'));
        this.elements.$tocBody.slideUp(); // close container in case a min-height is defined by the user

        this.elements.$widgetContainer.css('min-height', '0px');
    }

    _superPropBase(object, property) {
        while (!Object.prototype.hasOwnProperty.call(object, property)) {
          object = getPrototypeOf(object);
          if (object === null) break;
        }
  
        return object;
    }
    _get3(target, property, receiver) {
        if (typeof Reflect !== "undefined" && Reflect.get) {
            return Reflect.get(target, property, receiver || target);
          module.exports = _get = Reflect.get;
        } else {
            var base = superPropBase(target, property);
            if (!base) return;
            var desc = Object.getOwnPropertyDescriptor(base, property);

            if (desc.get) {
                return desc.get.call(receiver);
            }

            return desc.value;
          
        }
  
        return _get(target, property, receiver || target);
    }
    _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);

        // module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
        //   return o.__proto__ || Object.getPrototypeOf(o);
        // };
        // return _getPrototypeOf(o);
      }
    onInit() {
        var _get2,
            _this6 = this;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        (_get2 = (0, this._get3)((0, this._getPrototypeOf)(PrettyTOCHandler.prototype), "onInit", this)).call.apply(_get2, [this].concat(args));

        this.viewportItems = [];
        jQuery(document).ready(function () {
            return _this6.run();
        });
    }

    onListItemClick(event) {

        var _this7 = this;

        this.itemClicked = true;
        setTimeout(function () {
            return _this7.itemClicked = false;
        }, 2000);
        var $clickedItem = jQuery(event.target),
            $list = $clickedItem.parent().next(),
            collapseNestedList = this.getElementSettings('collapse_subitems');
        var listIsActive;

        if (collapseNestedList && $clickedItem.hasClass(this.getSettings('classes.firstLevelListItem'))) {
            if ($list.is(':visible')) {
                listIsActive = true;
            }
        }

        this.activateItem($clickedItem);

        if (collapseNestedList && listIsActive) {
            $list.slideUp();
        }

        var hash = $clickedItem[0].hash;

        if (this.getElementSettings('update_url_hash') == 'yes' && history.replaceState) {
            history.replaceState(null, '', hash)
        }
    }
}

// When the frontend of Elementor is created, add our handler
jQuery(window).on('elementor/frontend/init', () => {
    const addHandler = ($element) => {
        elementorFrontend.elementsHandler.addHandler(PrettyTOCHandler, {
            $element,
        });
    };
    // Add our handler to the pretty-toc Widget (this is the slug we get from get_name() in PHP)
    elementorFrontend.hooks.addAction('frontend/element_ready/pretty-toc.default', addHandler);
});