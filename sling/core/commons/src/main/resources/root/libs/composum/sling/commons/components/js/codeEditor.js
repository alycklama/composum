/**
 *
 *
 */
(function (core) {
    'use strict';

    core.components = core.components || {};

    (function (components) {

        /**
         * the 'code-editor-widget'
         *
         */
        components.CodeEditorWidget = Backbone.View.extend({

            initialize: function (options) {

                this.$editor = this.$('.code-editor');
                this.$findText = this.$('.search .find-text');
                this.$findNext = this.$('.search .find-next');
                this.$findPrev = this.$('.search .find-prev');
                this.$matchCase = this.$('.match-case');
                this.$findRegEx = this.$('.find-regex');
                this.$replText = this.$('.replace .replace-text');
                this.$replCurrent = this.$('.replace .replace');
                this.$replAll = this.$('.replace .replace-all');
                this.$undo = this.$('.undo');
                this.$redo = this.$('.redo');

                this.initEditor(_.bind(function (data) {
                    this.ace.setReadOnly(true);
                    this.ace.navigateFileStart();
                }, this));
                this.$el.resize(_.bind(this.resize, this));

                this.$('.editor-toolbar .start-editing').click(_.bind(this.openEditDialog, this));

                this.searchOptions = {
                    wrap: true,
                    caseSensitive: false,
                    regExp: false
                };
                this.$findText.on('input', _.bind(function (event) {
                    this.findText();
                }, this));
                this.$findText.keypress(_.bind(function (event) {
                    this.findText();
                }, this));
                this.$findNext.click(_.bind(this.findNext, this));
                this.$findPrev.click(_.bind(this.findPrev, this));
                this.$matchCase.change(_.bind(this.toggleCaseSensitive, this));
                this.$findRegEx.change(_.bind(this.toggleRegExp, this));
                this.$replCurrent.click(_.bind(this.replace, this));
                this.$replAll.click(_.bind(this.replaceAll, this));

                this.$undo.click(_.bind(this.undo, this));
                this.$redo.click(_.bind(this.redo, this));
            },

            initEditor: function (onSuccess) {
                this.ace = ace.edit(this.$editor[0]);
                this.ace.setTheme('ace/theme/clouds');
                var type = this.$editor.attr('data-type');
                if (type) {
                    this.ace.getSession().setMode('ace/mode/' + type);
                }
                this.loadText(onSuccess);
            },

            openEditDialog: function () {
                this.dialog = core.getView('#text-edit-dialog', components.CodeEditorDialog);
                this.dialog.editSource(this);
            },

            getPath: function () {
                return this.$editor.attr("data-path");
            },

            /**
             * loads the text data (jcr:data property) of the node referenced by the 'data-path' attribute
             * of the editor DOM element ($...('.text-editor .code-editor')) into the editor
             * @param event the current event object (used if target is undefined)
             * @param target the editor DOM element (can be undefined - than the events target is used to find it)
             * @param onSuccess the success callback handler (function(event,editor,data))
             */
            loadText: function (onSuccess) {
                var path = this.getPath();
                if (path) {
                    core.ajaxGet("/bin/core/property.bin" + path, {
                            contentType: 'text/plain;charset=UTF-8',
                            dataType: 'text'
                        }, _.bind(function (data) {
                            this.ace.setValue(data);
                            this.ace.clearSelection();
                            if (_.isFunction(onSuccess)) {
                                onSuccess(data);
                            }
                        }, this),
                        _.bind(function (result) {
                            core.alert('danger', 'Error', 'Error on loading text', result);
                        }, this));
                }
            },

            saveText: function (onSuccess) {
                var path = this.getPath();
                if (path) {
                    core.ajaxPut("/bin/core/property.bin" + path, this.ace.getValue(), {
                        contentType: 'text/plain;charset=UTF-8',
                        dataType: 'text'
                    }, undefined, undefined, _.bind(function (result, x, y) {
                        if (result.status == 200) {
                            if (_.isFunction(onSuccess)) {
                                onSuccess(result);
                            }
                        } else {
                            core.alert('danger', 'Error', 'Error on updating text', result);
                        }
                    }, this));
                }
            },

            reset: function () {
                this.ace.destroy();
            },

            resize: function () {
                this.ace.resize();
            },

            findText: function (text) {
                if (!text) {
                    text = this.$findText.val();
                }
                if (text) {
                    this.searchOptions.backwards = false;
                    this.ace.findAll(text, this.searchOptions, false);
                }
            },

            findNext: function () {
                this.searchOptions.backwards = false;
                this.ace.findNext(this.searchOptions, false);
            },

            findPrev: function () {
                this.searchOptions.backwards = true;
                this.ace.findPrevious(this.searchOptions, false);
            },

            toggleCaseSensitive: function (event) {
                this.searchOptions.caseSensitive = event
                    ? event.currentTarget.checked
                    : !this.searchOptions.caseSensitive;
                this.findText();
            },

            toggleRegExp: function (event) {
                this.searchOptions.regExp = event
                    ? event.currentTarget.checked
                    : !this.searchOptions.regExp;
                this.findText();
            },

            replace: function () {
                var text = this.$replText.val();
                if (text) {
                    this.ace.replace(text, this.searchOptions);
                }
            },

            replaceAll: function () {
                var text = this.$replText.val();
                if (text) {
                    this.ace.replaceAll(text, this.searchOptions);
                }
            },

            undo: function () {
                this.ace.undo();
            },

            redo: function () {
                this.ace.redo();
            }
        });

        components.CodeEditorDialog = components.Dialog.extend({

            initialize: function (options) {
                core.components.Dialog.prototype.initialize.apply(this, [options]);
                this.editor = core.getWidget(this.el, '.widget.code-editor-widget', components.CodeEditorWidget);
                // initialize the dialogs toolbar and buttons
                this.$('button.save').click(_.bind(function (event) {
                    this.cursor = this.editor.ace.getCursorPosition();
                    this.editor.saveText(_.bind(function (result) {
                        if (this.source) {
                            this.source.loadText(_.bind(function (data) {
                                this.source.ace.navigateTo(this.cursor.row, this.cursor.column);
                                this.source.ace.scrollToRow(Math.max(this.cursor.row - 2, 0));
                            }, this));
                        }
                        this.hide();
                    }, this));
                }, this));
            },

            /**
             * defines the text editor dialog source component which holds the text view
             * and opens the dialog with the same text as visible in the view and with the
             * same editor state (cursor, selection)
             */
            editSource: function (source) {
                this.source = source;
                // initialize the dialog with the templates data
                var path = this.source.getPath();
                this.$('.modal-title').text(path);
                this.editor.$editor.attr('data-path', path);
                this.editor.$editor.attr('data-type', this.source.$editor.attr('data-type'));
                this.selection = this.source.ace.getSelectionRange();
                this.cursor = this.source.ace.getCursorPosition();
                // display the editor in the modal dialog
                this.show(_.bind(function () {
                    // initialize the editor instance
                    this.editor.initEditor(_.bind(function () {
                        this.editor.ace.setReadOnly(false);
                        /*
                         if (this.selection) {
                         this.editor.ace.addSelectionMarker(this.selection);
                         this.editor.ace.updateSelectionMarkers();
                         }
                         */
                        this.editor.ace.scrollToRow(Math.max(this.cursor.row - 2, 0));
                        this.editor.ace.navigateTo(this.cursor.row, this.cursor.column);
                        this.editor.ace.focus();
                    }, this));
                }, this));
            },

            reset: function () {
                components.Dialog.prototype.reset.apply(this);
                this.editor.reset();
            }
        });

    })(core.components);

})(window.core);
