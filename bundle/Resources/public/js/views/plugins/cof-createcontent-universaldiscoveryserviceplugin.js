/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('cof-createcontent-universaldiscoveryserviceplugin', function (Y) {
    'use strict';
    /**
     * Adds plugins to:
     * - the universal discovery view service
     *
     * @module cof-createcontent-universaldiscoveryservice
     */

    Y.namespace('cof.Plugin');

    Y.cof.Plugin.CreateContentUniversalDiscoveryService = Y.Base.create('CreateContentUniversalDiscoveryServicePlugin', Y.eZ.Plugin.ViewServiceBase, [Y.eZ.Plugin.PublishDraft], {
        initializer: function () {
            this.onHostEvent('*:openUniversalDiscoveryWidget', this._openUniversalDiscoveryWidget, this);
            this.onHostEvent('*:prepareContentModel', this._loadContentTypeData, this);
            this.onHostEvent('*:setParentLocation', this._setParentLocation, this);
            this.onHostEvent('*:publishedDraft', this._loadContentLocation, this);
        },

        /**
         * Opens a new Discovery Widget.
         *
         * @protected
         * @method _saveDiscoveryState
         * @param event {Object} event facade
         */
        _openUniversalDiscoveryWidget: function (event) {
            var app = this.get('host').get('app'),
                target = event.target;

            target.set('restoreFormState', true);
            target.set('displayed', false);

            /**
             * Close the universal discovery widget.
             * Listened by eZ.PlatformUIApp
             *
             * @event cancelDiscover
             */
            app.fire('cancelDiscover');
            /**
             * Open the universal discovery widget.
             * Listened by eZ.PlatformUIApp
             *
             * @event contentDiscover
             * @param config {Object} config of the universal discovery widget
             */
            app.fire('contentDiscover', {
                config: {
                    title: this.get('discoveryWidgetTitle'),
                    multiple: false,
                    contentDiscoveredHandler: Y.bind(this._setSelectedLocation, this, target),
                    isSelectable: function () {return true;},
                    visibleMethod: 'browse',
                    hideTabCreate: true
                },
            });
        },

        /**
         * Sets the selected location.
         *
         * @protected
         * @method _setSelectedLocation
         * @param target {Y.View} target where set selected location
         * @param event {Object} event facade
         */
        _setSelectedLocation: function (target, event) {
            var host = this.get('host'),
                app = host.get('app');

            event.preventDefault();
            event.stopPropagation();

            event.selection.location.loadPath({api: host.get('capi')}, Y.bind(function (error, path) {
                if (error) {
                    /**
                     * Displays a notification bar with error message.
                     * Listened by eZ.PlatformUIApp
                     *
                     * @event notify
                     * @param notification {Object} notification data
                     */
                    target.fire('notify', {
                        notification: {
                            text: this.get('notificationErrorText'),
                            identifier: 'loading-path-error',
                            state: 'error',
                            timeout: 0
                        }
                    });

                    return;
                }

                target.set('selectedLocation', event.selection);
            }, this));

            target.set('displayed', true);

            /**
             * Fired to restore the universal discovery state.
             * Listened by cof.Plugin.CreateContentUniversalDiscovery
             *
             * @event restoreDiscoveryWidget
             */
            target.fire('restoreDiscoveryWidget');

            /**
             * Close the universal discovery widget.
             * Listened by eZ.PlatformUIApp
             *
             * @event cancelDiscover
             */
            app.fire('cancelDiscover');
            /**
             * Open the universal discovery widget.
             * Listened by eZ.PlatformUIApp
             *
             * @event contentDiscover
             */
            app.fire('contentDiscover');
        },

        /**
         * Loads the content type data.
         *
         * @protected
         * @method _loadContentTypeData
         * @param event {Object} event facade
         */
        _loadContentTypeData: function (event) {
            var type = event.contentType,
                host = this.get('host');

            type.load({api: host.get('capi')}, Y.bind(function (error) {
                if (error) {
                    /**
                     * Displays a notification bar with error message.
                     * Listened by eZ.PlatformUIApp
                     *
                     * @event notify
                     * @param notification {Object} notification data
                     */
                    host.fire('notify', {
                        notification: {
                            text: "Could not load the content type with id '" + type.get('id') + "'",
                            identifier: 'loading-content-type-error',
                            state: 'error',
                            timeout: 0
                        }
                    });

                    return;
                }

                this._setContentTypeData(event);
            }, this));
        },

        /**
         * Sets the data required to create new content
         *
         * @method _setContentTypeData
         * @protected
         * @param event {Object} event facade
         */
        _setContentTypeData: function (event) {
            var content = new Y.eZ.Content(),
                version = new Y.eZ.Version(),
                type = event.contentType,
                mainLanguageCode = type.get('mainLanguageCode'),
                host = this.get('host'),
                user = host.get('app').get('user'),
                target = event.target,
                defaultFields = {};

            content.set('name', 'New "' + type.get('names')[mainLanguageCode] + '"');

            Y.Object.each(type.get('fieldDefinitions'), function (fieldDef, identifier) {
                defaultFields[identifier] = {
                    fieldDefinitionIdentifier: identifier,
                    fieldValue: fieldDef.defaultValue,
                };
            });

            host.setAttrs({
                content: content,
                version: version,
                languageCode: mainLanguageCode,
                contentType: type,
                eventTarget: target
            });

            target.setAttrs({
                content: content,
                version: version,
                languageCode: mainLanguageCode,
                owner: user,
                user: user
            });

            target.get('content').set('fields', defaultFields);
            target.get('version').set('fields', defaultFields);
        },

        /**
         * Sets the parent location
         *
         * @method _setParentLocation
         * @protected
         * @param event {Object} event facade
         */
        _setParentLocation: function (event) {
            this.get('host').set('parentLocation', event.selectedLocation);
        },

        /**
         * Loads the content location of the published content
         *
         * @method _setSelectedLocation
         * @protected
         * @param event {Object} event facade
         */
        _loadContentLocation: function (event) {
            var host = this.get('host');

            event.content.loadLocations({api: host.get('capi')}, function (error, response) {
                host.get('app').set('loading', false);

                host.get('eventTarget').fire('contentLoaded', {
                    contentInfo: event.content,
                    location: response[0],
                    contentType: host.get('contentType')
                });
            });
        },
    }, {
        NS: 'CreateContentUniversalDiscoveryServicePlugin',
        ATTRS: {
            /**
             * The title of the Universal Discovery Widget
             *
             * @attribute discoveryWidgetTitle
             * @type String
             * @default 'Select the location for your content'
             */
            discoveryWidgetTitle: {
                value: 'Select the location for your content'
            },

            /**
             * The text for the notification error
             *
             * @attribute notificationErrorText
             * @type String
             * @default 'An error occured when getting the location path'
             */
            notificationErrorText: {
                value: 'An error occured when getting the location path'
            }
        }
    });

    Y.eZ.PluginRegistry.registerPlugin(
        Y.cof.Plugin.CreateContentUniversalDiscoveryService, ['universalDiscoveryViewService']
    );
});