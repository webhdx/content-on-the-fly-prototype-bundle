/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('cof-contentcreationview', function (Y) {
    'use strict';

    /**
     * Provides the Content Creation View class
     *
     * @module cof-contentcreationview
     */
    Y.namespace('cof');

    var CLASS_HIDDEN = 'cof-is-hidden',
        CLASS_LOADING = 'is-loading',
        CLASS_CONTENT_CREACTION = 'cof-content-creation',
        CLASS_BUTTON = 'cof-btn',
        CLASS_BUTTON_DISABLED = CLASS_BUTTON + '--disabled',
        CLASS_ON_PAGE_TWO = 'on-page-two',
        SELECTOR_CONTENT_CREACTION = '.' + CLASS_CONTENT_CREACTION,
        SELECTOR_BUTTON = '.' + CLASS_BUTTON,
        SELECTOR_NEXT_BUTTON = SELECTOR_BUTTON + '--next',
        SELECTOR_BACK_BUTTON = SELECTOR_BUTTON + '--back',
        SELECTOR_FINISH_BUTTON = SELECTOR_BUTTON + '--finish',
        SELECTOR_CONTENT_TYPE =SELECTOR_CONTENT_CREACTION +  '__content-type-selector',
        SELECTOR_CHANGE_CONTENT_TYPE = '.cof-btn--change-content-type',
        SELECTOR_ITEM_SELECTED = '.ez-selection-filter-item-selected',
        ATTR_DESCRIPTION = 'data-description',
        TOOLTIP = '<div class="cof-content-creation__tooltip cof-is-hidden"></div>',
        EVENTS = {};

    EVENTS[SELECTOR_NEXT_BUTTON] = {'tap': '_changeFormPage'};
    EVENTS[SELECTOR_BACK_BUTTON] = {'tap': '_changeFormPage'};
    EVENTS[SELECTOR_CHANGE_CONTENT_TYPE] = {'tap': '_changeFormPage'};

    /**
     * The Content Creation view
     *
     * @namespace cof
     * @class ContentCreationView
     * @constructor
     * @extends eZ.TemplateBasedView
     */
    Y.cof.ContentCreationView = Y.Base.create('ContentCreationView', Y.eZ.TemplateBasedView, [], {
        events: EVENTS,

        initializer: function () {
            this.on('displayedChange', this._getContentTypes, this);
            this.on('contentTypeGroupsChange', this._renderContentTypeSelector, this);
            this.on('*:itemSelected', this._enableNextButton, this);
            this.on('*:itemSelected', this._toggleTooltip, this);
        },

        render: function () {
            this.get('container').setHTML(this.template({
                finishBtnText: this.get('finishBtnText')
            }));

            return this;
        },

        /**
         * Toggles the tooltip visibility
         *
         * @protected
         * @method _toggleTooltip
         */
        _toggleTooltip: function () {
            var selectedItem = this.get('container').one(SELECTOR_ITEM_SELECTED),
                contentTypeSelectorView = this.get('contentTypeSelectorView');

            if (selectedItem && selectedItem.getAttribute(ATTR_DESCRIPTION)) {
                contentTypeSelectorView.showTooltip();
            } else {
                contentTypeSelectorView.hideTooltip();
            }
        },

        /**
         * Enables the next button
         *
         * @protected
         * @method _enableNextButton
         * @param event {Object} event facade
         * @param event.text {String} the selected content type name
         */
        _enableNextButton: function (event) {
            var container = this.get('container');

            container.one(SELECTOR_CHANGE_CONTENT_TYPE).setHTML(event.text);
            container.one(SELECTOR_NEXT_BUTTON).removeClass(CLASS_BUTTON_DISABLED);
        },

        /**
         * Gets the Content Types
         *
         * @protected
         * @method _getContentTypes
         * @param event {Object} event facade
         */
        _getContentTypes: function (event) {
            var container = this.get('container');

            if (!event.newVal) {
                this._resetFormState();

                return;
            }

            this.get('contentTypeSelectorView').hideTooltip();

            container.one(SELECTOR_CONTENT_TYPE).addClass(CLASS_LOADING);
            container.one(SELECTOR_NEXT_BUTTON).addClass(CLASS_BUTTON_DISABLED);

            /**
             * Fetches the content types data.
             * Listened in the cof.Plugin.createContentSelectContentType
             */
            this.fire('fetchContentTypes');
        },

        /**
         * Resets the content creation form state
         *
         * @protected
         * @method _resetFormState
         */
        _resetFormState: function () {
            this.set('activePage', 0);

            this.get('container').removeClass(CLASS_ON_PAGE_TWO);
        },

        /**
         * Render the Content Type Selector View.
         *
         * @protected
         * @method _renderContentTypeSelector
         * @param event {Object} event facade
         */
        _renderContentTypeSelector: function (event) {
            var selectorContainer = this.get('container').one(SELECTOR_CONTENT_TYPE),
                contentTypeSelectorView = this.get('contentTypeSelectorView');

            contentTypeSelectorView.set('contentTypeGroups', event.newVal);

            selectorContainer.append(contentTypeSelectorView.render().get('container').append(TOOLTIP));
            selectorContainer.removeClass(CLASS_LOADING);
        },

        /**
         * Changes the page of the Content Creation Widget.
         *
         * @protected
         * @method _changeFormPage
         * @param event {Object} event facade
         */
        _changeFormPage: function (event) {
            var activePage = this.get('activePage'),
                onPageTwoMethodName = activePage ? 'removeClass' : 'addClass',
                tooltipMethodName = activePage ? 'showTooltip' : 'hideTooltip';

            if (event && event.target.hasClass(CLASS_BUTTON_DISABLED)) {
                return;
            }

            this.get('container')[onPageTwoMethodName](CLASS_ON_PAGE_TWO);

            this.get('contentTypeSelectorView')[tooltipMethodName]();

            this.set('activePage', activePage ? 0 : 1);
        },
    }, {
        ATTRS: {
            /**
             * The Content Creation Widget Content Type Selector view instance
             *
             * @attribute contentTypeSelectorView
             * @type Y.View
             */
            contentTypeSelectorView: {
                valueFn: function () {
                    return new Y.cof.ContentTypeSelectorView({
                        bubbleTargets: this
                    });
                }
            },

            /**
             * Which page is active:
             * 0 - first
             * 1 - second
             *
             * @attribute activePage
             * @type Number
             * @default 0
             */
            activePage: {
                value: 0
            },

            /**
             * The finish button text
             *
             * @attribute finishBtnText
             * @type String
             * @default 'Confirm selection'
             */
            finishBtnText: {
                value: 'Confirm selection'
            },

            /**
             * Is view expanded?
             *
             * @attribute expanded
             * @type Boolean
             * @default true
             * @readOnly
             */
            expanded: {
                value: true,
                readOnly: true
            },
        }
    });
});