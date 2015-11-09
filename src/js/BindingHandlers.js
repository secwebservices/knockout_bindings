/*global define, $, window */

/**
 * BindingHandlers
 * @author Robert Suppenbach
 * Aranya Software - Kaya Knockoutjs Binding Handlers
 */
define("BindingHandlers",
        [
             "Mediator", "knockoutjs", "jqplot", "LoggerConfig", "jquery-textcounter", 
             "jquery-inputmask", "jquery-scrollbar", "PStrength", "Help_ModalUiDelegate", 
             "ECM_HelpConfig", "Audit_HelpConfig", "Building_HelpConfig", "Zone_HelpConfig", 
             "Meter_HelpConfig", "jqplot-canvasTextRenderer", "jqplot-canvasAxisLabelRenderer", 
             "jqplot-pointLabels","jqplot-highlighter"
        ], 
        function(
                Mediator, ko, jqplot, LoggerConfig, jqueryTextAreaCounter, 
                jqueryInputMask, jqueryScrollbar, PStrength, HelpModalUiDelegate, 
                ECMHelpConfig, AuditHelpConfig, BuildingHelpConfig, ZoneHelpConfig,
                MeterHelpConfig, textRenderer, axisLabelRenderer, pointLabels,
                highlighter
        ) 
{
    var logger, tabsTemplate, fileUploadTemplate, scheduleTemplate, 
    StringTemplateSource, stringTemplateEngine, extendLiteral, writeValueToProperty, 
    graphPlots = [], guid, pagerLinksTemplate, itemsPerPageTemplate,
    makeTemplateValueAccessor, defaultPagerIfEmpty, checkItemPerPageBinding, checkTotalItemsBinding;

    logger = new LoggerConfig().getLogger("BindingHandlers.js");
    logger.info("Initializing Knockout Binding Handlers");
    
    tabsTemplate = '<ul class="ui-tabs" data-bind="foreach: $data"><li><a data-bind="attr: {href:\'#\'+tabId}, text:tabLabel"></a></li></ul>'
            + '<div data-bind="foreach: $data, attr:{id:\'tabs-wrapper\'}"><div data-bind="attr: {id:tabId}"></div></div>';

    fileUploadTemplate = '<iframe data-bind="attr: {id: id + \'_file_upload\', '
            + 'name: \'file_upload\', src: \'/cms-global/fileupload/fileupload.form?formFieldId=\'+id}"'
            + ' frameborder="0" width="435px" height="55px" scrolling="no" class="fileUploadIFrame"></iframe>';
    
    scheduleTemplate = '<tr>'
                     + '    <td class="timeColumn" data-bind="text: $data.label"></td>'
                     + '    <td>Sun</td>'
                     + '    <td>Mon</td>'
                     + '    <td>Tues</td>'
                     + '    <td>Wed</td>'
                     + '    <td>Thur</td>'
                     + '    <td>Fri</td>'
                     + '    <td>Sat</td>'
                     + '</tr>'
                     + '<!-- ko foreach: $data.hours -->'
                     + '<tr>'
                     + '    <td data-bind="text: $data"></td>'
                     + '    <!-- ko foreach: $parentContext.$data.days -->'
                     + '    <td data-bind="css: $parentContext.$parentContext.$data.getCSS($index(), $parentContext.$index())"></td>'
                     + '           <!-- /ko -->'
                     + '       </tr>'
                     + '<!-- /ko -->';
    
    
    
    pagerLinksTemplate = 
        "<div class='pager' data-bind='if: totalPages() > 1'>" + 
        "    <span class='first-page-link'><a class='pager-button fa fa-fast-backward' data-bind='click: page.bind($data, 1), enable: page() > 1, css: {disabled: page() == 1}'><<</a></span>" + 
        "    <span class='pager-pages' data-bind='foreach: relativePages'>" + 
        "        <span class='pager-page'><a class='pager-button' href='#' data-bind='click: $parent.page.bind($parent, $data), text: $data, css: { selected: $parent.page() == $data }'></a></span>" + 
        "    </span>" + 
        "    <span class='last-page-link'><a class='pager-button fa fa-fast-forward' data-bind='click: page.bind($data, totalPages()), enable: page() < totalPages(), css: { disabled: page() == totalPages() }'>>></a></span>" + 
        "</div>";

    itemsPerPageTemplate =
        "<select class='itemsPerPage' data-bind='value: itemsPerPage, enable: allowChangePageSize'>" +
        "    <option>25</option>" +
        "    <option>50</option>" +
        "    <option>100</option>" +
        "</select>";

    StringTemplateSource = function(template) {
        this.template = template;
    };

    StringTemplateSource.prototype.text = function() {
        return this.template;
    };

    stringTemplateEngine = new ko.nativeTemplateEngine();
    stringTemplateEngine.makeTemplateSource = function(template) {
        return new StringTemplateSource(template);
    };
    
    ko.bindingHandlers.fadeVisible = {
        init: function(element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
        },
        update: function(element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            setTimeout(function(){
                if(ko.unwrap(value)){
                    $(element).fadeIn(750);
                }else{
                    $(element).fadeOut(250);
                }
            },1);
        }
    }; 

    ko.bindingHandlers.slideVisible = {
            init: function(element, valueAccessor) {
                // Initially set the element to be instantly visible/hidden depending on the value
                var value = valueAccessor();
                $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
            },
            update: function(element, valueAccessor) {
                // Whenever the value subsequently changes, slowly fade the element in or out
                var value = valueAccessor();
                setTimeout(function(){
                    if(ko.unwrap(value)){
                        $(element).show('slide', {direction: 'left'}, 750);
                    }else{
                        $(element).hide('slide', {direction: 'left'}, 250);
                        
                    }
                },1);
            }
        };    
    
    ko.bindingHandlers.breadcrumbSlideVisible = {
        init: function(element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
        },
        update: function(element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            setTimeout(function(){
                if(ko.unwrap(value)){
                    $(element).parent().show();
                    $(element).show('slide', {direction: 'left'}, 750);
                }else{
                    $(element).hide('slide', {direction: 'left'}, 250, function(){
                        $(element).parent().hide();    
                    });
                    
                }
            },1);
        }
    };     

    /**
     * numericText
     */
    logger.debug("Adding numericText binding");    
    ko.bindingHandlers.numericText = {
        "update" : function(element, valueAccessor, allBindingsAccessor) {
            try {
                var value = ko.utils.unwrapObservable(valueAccessor()), 
                    format = ko.utils.unwrapObservable(allBindingsAccessor().format) || 'decimal', 
                    convertToWhole = ko.utils.unwrapObservable(allBindingsAccessor().convertToWhole) || false, 
                    positions = ko.utils.unwrapObservable(allBindingsAccessor().positions) || 0, 
                    formattedValue, finalFormatted;

                if ( format === 'decimal' ) {
                    if(isNaN(positions)){
                        positions = 0;
                    }
                    formattedValue = typeof value === 'number' ? value.toFixed(positions) : Number(value).toFixed(positions);
                    finalFormatted = ko.bindingHandlers.numericText.withCommas(formattedValue);
                } else if ( format === 'dollar' ) {
                    if(isNaN(positions)){
                        positions = 2;
                    }
                    formattedValue = typeof value === 'number' ? value.toFixed(positions) : Number(value).toFixed(positions);
                    finalFormatted = ko.bindingHandlers.numericText.dollar(formattedValue);
                } else if ( format === 'percentage' ) {
                    if(isNaN(positions)){
                        positions = 0;
                    }
                    formattedValue = typeof value === 'number' ? value : Number(value);
                    finalFormatted = ko.bindingHandlers.numericText.percentage(formattedValue, convertToWhole, positions);
                } else if ( format === 'temperature' ) {   
                    if(isNaN(positions)){
                        positions = 1;
                    }
                    formattedValue = typeof value === 'number' ? value : Number(value);                    
                    finalFormatted = ko.bindingHandlers.numericText.temperature(formattedValue, positions);
                }

                if(format === 'temperature'){
                    ko.bindingHandlers.html.update(element, function() {
                        return finalFormatted;
                    });
                }else{
                    ko.bindingHandlers.text.update(element, function() {
                        return finalFormatted;
                    });                    
                }

            } catch (e) {
                logger.error("Error binding to numericText", e.stack);
            }
        },
        "withCommas" : function(original) {
            try {
                original += '';
                var rgx = /(\d+)(\d{3})/, x = original.split('.'), x1 = x[0], x2 = x.length > 1 ? '.' + x[1]
                        : '';
                while (rgx.test(x1)) {
                    x1 = x1.replace(rgx, '$1' + ',' + '$2');
                }
                return x1 + x2;
            } catch (e) {
                logger.error("Error binding to numericText", e.stack);
            }
        },
        "dollar" : function(original) {
            try {
                original += '';
                var rgx = /(\d+)(\d{3})/, x = original.split('.'), x1 = x[0], x2 = x.length > 1 ? '.' + x[1]
                        : '';
                while (rgx.test(x1)) {
                    x1 = x1.replace(rgx, '$1' + ',' + '$2');
                }
                return "$" + x1 + x2;
            } catch (e) {
                logger.error("Error binding to numericText", e.stack);
            }
        },
        "percentage" : function(original, convertToWhole, positions) {
            try {
                if ( convertToWhole ) {
                    original = parseFloat(original) * 100;
                }
                
                if(original === Math.floor(original)){
                    positions = 0;
                }
                
                original = original.toFixed(positions) + "%";

                return original;

            } catch (e) {
                logger.error("Error binding to numericText", e.stack);
            }
        },
        "temperature" : function(original, positions) {
            try {
                original = parseFloat(original);
                
                if(original === Math.floor(original)){
                    positions = 0;
                }
                
                original = original.toFixed(positions) + " &#176;F";

                return original;

            } catch (e) {
                logger.error("Error binding to numericText", e.stack);
            }
        }
    };
    
    /**
     * numericValue
     */
    logger.debug("Adding numericValue binding");      
    ko.bindingHandlers.numericValue = {
       formats :  {
            "decimal": { 
                format: {
                    'alias': 'decimal', 
                    'groupSeparator': ',', 
                    'autoGroup': true, 
                    'digits': 4, 
                    'digitsOptional': true,
                    'placeholder': '',
                    'showTooltip': true
                } 
            },
            "dollar": { 
                format: {
                    'alias': 'numeric', 
                    'groupSeparator': ',', 
                    'autoGroup': true, 
                    'digits': 4, 
                    'digitsOptional': true, 
                    'prefix': '$', 
                    'placeholder': '',
                    'showTooltip': true
                } 
            },
            "percentage": { 
                format: {
                    'alias': 'decimal', 
                    'digits': 2, 
                    'digitsOptional': true, 
                    'suffix': ' %',
                    'placeholder': '',
                    'showTooltip': true
                } 
            },
            "temperature": { 
                format: {
                    'alias': 'decimal',
                    'digits': 2, 
                    'digitsOptional': true, 
                    'suffix': ' F',
                    'placeholder': '',
                    'showTooltip': true
                } 
            }
            
        },     
        init : function(element, valueAccessor, allBindingsAccessor) {
            var format = ko.utils.unwrapObservable(allBindingsAccessor().format) || 'decimal',
            underlyingObservable = valueAccessor(),
            selectedFormat = ko.bindingHandlers.numericValue.formats[format],
            interceptor;
                        
            $(element).inputmask(selectedFormat.format, {numericInput: true});
            
            $(element).keyup(function(ev){
                if(ev.keyCode === 190 || ev.which === 190){ 
                    var value = $(element).val().replace(/[^\d\.\-]/g, '');

                    if(value === "" || String.isTextSelected($(element)[0]) ){
                        $(element).val("0."); 
                    }                        
                }
            });           
            
            interceptor = ko.computed({
                read : underlyingObservable,
                write : function(value) {                    
                    // cleanup the input remove any non digits and decimals.
                    value = parseFloat(value.replace(/[^\d\.\-]/g, ''));
                    if ( !isNaN(value) ) {
                        underlyingObservable(value);
                    }
                }
            });
            
            interceptor.subscribe(function(){
                var value = $(element).val();
                if(value !== "0."){
                    $(element).trigger('setvalue.inputmask');
                }
            });
            
            setTimeout(function(){
                ko.bindingHandlers.value.init(element, function() {
                    return interceptor;
                }, allBindingsAccessor);
            }, 1);
        }        
    };
    
    /**
     * numericValue
     */
    logger.debug("Adding dateValue binding");      
    ko.bindingHandlers.dateValue = {
 
        init : function(element, valueAccessor, allBindingsAccessor) {
            var underlyingObservable = valueAccessor(),
            interceptor;
                        
            $(element).inputmask("mm/dd/yyyy", { alias: 'date', rightAlign: true });
            
            interceptor = ko.computed({
                read : underlyingObservable,
                write : function(value) {                    
                    underlyingObservable(value);
                }
            });
            
            setTimeout(function(){
                ko.bindingHandlers.value.init(element, function() {
                    return interceptor;
                }, allBindingsAccessor);
            }, 1);
        }        
    };

    /**
     * percentage
     */
    logger.debug("Adding percentage binding"); 
    ko.bindingHandlers.percentage = {
        init : function(element, valueAccessor, allBindingsAccessor) {
            var underlyingObservable, interceptor;
            underlyingObservable = valueAccessor();
            interceptor = ko.computed(function() {
                var ret, positions;
                if ( ko.utils.unwrapObservable(allBindingsAccessor().positions) !== undefined ) {
                    positions = ko.utils.unwrapObservable(allBindingsAccessor().positions);
                } else {
                    positions = ko.bindingHandlers.percentage.defaultPositions;
                }
                // positions = ko.utils.unwrapObservable(allBindingsAccessor().positions) ||
                // ko.bindingHandlers.percentage.defaultPositions;
                ko.utils.unwrapObservable(valueAccessor());
                if ( typeof underlyingObservable === "function" ) {
                    ret = (underlyingObservable() * 100).toFixed(positions).replace(/\.?0+$/, '');
                } else {
                    ret = (underlyingObservable * 100).toFixed(positions).replace(/\.?0+$/, '');
                }

                return ret;
            });

            ko.bindingHandlers.text.update(element, function() {
                return interceptor;
            }, allBindingsAccessor);
        },
        defaultPositions : 2,
        update : function(element, valueAccessor, allBindingsAccessor) {
            var underlyingObservable, interceptor;
            underlyingObservable = valueAccessor();
            interceptor = ko.computed(function() {
                var ret, positions;
                if ( ko.utils.unwrapObservable(allBindingsAccessor().positions) !== undefined ) {
                    positions = ko.utils.unwrapObservable(allBindingsAccessor().positions);
                } else {
                    positions = ko.bindingHandlers.percentage.defaultPositions;
                }
                ko.utils.unwrapObservable(valueAccessor());
                if ( typeof underlyingObservable === "function" ) {
                    ret = (underlyingObservable() * 100).toFixed(positions).replace(/\.?0+$/, '');
                } else {
                    ret = (underlyingObservable * 100).toFixed(positions).replace(/\.?0+$/, '');
                }

                return ret;
            });
            ko.bindingHandlers.text.update(element, function() {
                return interceptor;
            }, allBindingsAccessor);
        }
    };


    /**
     * enterKey
     */
    logger.debug("Adding enterKey binding");     
    ko.bindingHandlers.enterKey = {
        "init" : function(element, valueAccessor, allBindingsAccessor, data, viewModel) {
            var wrapperHandler, newValueAccessor, keycode;
            try {

                wrapperHandler = function(data, event) {
                    keycode = event.which || event.keyCode;
                    if ( keycode === 13 ) {
                        $(element).blur();
                        valueAccessor().call(this, data, event);
                    }
                };
                newValueAccessor = function() {
                    return {
                        "keyup" : wrapperHandler
                    };
                };
                ko.bindingHandlers.event.init(element, newValueAccessor, allBindingsAccessor, data, viewModel);
            } catch (e) {
                logger.error("Error in enterKey binding handler", e.stack);
            }
        }
    };

    /**
     * tabKey
     */
    logger.debug("Adding tabKey binding");    
    ko.bindingHandlers.tabKey = {
        "init" : function(element, valueAccessor, allBindingsAccessor, data, viewModel) {
            var wrapperHandler, newValueAccessor, keycode;
            try {
                wrapperHandler = function(data, event) {
                    keycode = event.which || event.keyCode;
                    if ( keycode === 9 && !event.shiftKey ) {
                        $(element).blur();
                        valueAccessor().call(this, data, event);
                        $(element).focus();
                    }
                };
                newValueAccessor = function() {
                    return {
                        "keyup" : wrapperHandler
                    };
                };
                ko.bindingHandlers.event.init(element, newValueAccessor, allBindingsAccessor, data, viewModel);
            } catch (e) {
                logger.error("Error in tabKey binding handler", e.stack);
            }
        }
    };

    /**
     * fileUpload
     */
    logger.debug("Adding fileUpload binding");
    ko.bindingHandlers.fileUpload = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var retVal, $uploadElement = $("<div>").insertBefore($(element));

            ko.renderTemplate(fileUploadTemplate, bindingContext.createChildContext(valueAccessor()), {
                templateEngine : stringTemplateEngine
            }, $uploadElement[0], "replaceNode");

            $(element).hide();
        }
    };
    
    

//    ko.bindingHandlers.fileUpload = {
//        init : function (element, valueAccessor, allBindingsAccessor) {
//            var fileInput = valueAccessor(),
//            allBindings = allBindingsAccessor(),
//            files = [ko.utils.unwrapObservable(ko.toJS(fileInput))];                
//            
//            $(element).hide();
//            $('.progress').hide();
//            $('.uploadStatus').hide();
//
//            $(element).fileupload({
//                dataType: 'json',
//         
//                done: function (e, data) {
//                    var lastUploaded = data.result.pop();
//                    console.log(lastUploaded);
//                    fileInput(lastUploaded.fileName);
//                    $('.progress').progressbar('destroy');
//                    $('.progress').hide();
//                    $('.uploadStatus').hide();
//                },
//                add: function (e, data){
//                    $('.progress').show();
//                    $('.uploadStatus').show();
//                    $('.uploadStatus').html("Uploading...");
//                    $('.progress').progressbar();
//                    data.submit();
//                },
//         
//                progress: function (e, data) {
//                    var progress = parseInt(data.loaded / data.total * 100, 10);
//                    console.log(progress);
//                    $('.progress').progressbar( "option", "value", progress);
//                    
//                    if(progress === 100){
//                        $('.uploadStatus').html("Upload Complete - Processing...");
//                    }else{
//                        $('.uploadStatus').html("Uploading... " + progress + "%");
//                    }
//                },
//                progressInterval: 50, 
//                formData : { path: allBindings.path || ''},
//         
//                dropZone: $('.dropzone')
//            }); 
//
//            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
//                $(element).fileupload("destroy");
//            });
//        }
//    };     

    /**
     * tabsFromFieldsets
     * 
     * converts a form with fieldsets into a tabs container.
     * supports updates to the tabs via a resetTabs trigger 
     *          example $(document).trigger('resetTabs');
     *          
     * usage  <form data-bind="tabsFromFieldsets : { tabs options }"  > .... </form>    
     */
    ko.bindingHandlers.tabsFromFieldsets = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            var config = ko.utils.unwrapObservable(valueAccessor()) || {
                selected: 0
            }, tabList, index = 0, fieldName;

            $(element).hide();
            fieldName = $(element).attr('name') || String.uuid();
            tabList = $('<ul id="tabsList"></ul>');
            $(element).prepend(tabList);  
            
            $.extend(config, {
                activate: function(e, ui){
                    if(ui.newPanel.hasClass('reportGraphContainer')){
                        $(document).trigger('refreshPlot'); 
                        $('.ui-tabs').tabs('refresh');
                    }
                    $(document).trigger('bounce.notifiers');  
                }
            });
            
            $(element).tabs(config);
            
            $(document).on('resetTabs', function(){
                $(element).children('fieldset').each(function(idx, fieldset) {
                    if(!$(fieldset).hasClass('tabContent')){  
                        var $li = $('<li></li>'), classes = [];
                        $(fieldset).attr('id', 'tab_' + fieldName + '_' + index).addClass('tabContent');
                        classes = $(fieldset).attr('class').split(/\s+/);
                        if(classes){
                            $.each(classes, function(a, htmlclass){
                                if(htmlclass.endsWith('HelpClass')){
                                    $li.attr('class', htmlclass);
                                    $(fieldset).removeClass(htmlclass);
                                }
                            });                              
                        }
                        $li.append('<a href="#tab_' + fieldName + '_' + index++ + '">' +  $(fieldset).find("legend").html() + '</a>');
                        $(tabList).append($li);
                    }else{
                        index++;
                    }
                });  
                
                setTimeout(function() {
                    try{
                        $(element).tabs("refresh");

                        if ( config.selected !== null ) {
                            $(element).tabs('select', config.selected);
                        }   
                    }catch(e){
                        logger.debug(e.message);
                    }

                }, 1);
            });
            
            setTimeout(function() {
                $(document).trigger('resetTabs');  
                $(element).fadeIn(500);
            }, 1);
        }
    };
    
    /**
     * uitabs
     */
    logger.debug("Adding uitabs binding");    
    ko.bindingHandlers.uitabs = {
        init : function(element, valueAccessor, allBindingsAccessor) {
            var config = ko.utils.unwrapObservable(valueAccessor()) || {},
            refreshOn = allBindingsAccessor().refreshOn || false,
            retVal;
                   
            $.extend(config, {
                activate: function(e, ui){
                    if(ui.newPanel.hasClass('reportGraphContainer')){
                        $(document).trigger('refreshPlot');  
                    }
                    $(document).trigger('bounce.notifiers');  
                }
            });
            
            if(refreshOn){
                refreshOn.subscribe(function(){                    
                    logger.debug('refreshing');

                    setTimeout(function() { 
                        if($(element).data("ui-tabs")){
                            $(element).tabs("destroy");
                        }
                        $(element).tabs(config);
                        $('.ui-tabs').tabs('refresh');
                    }, 1); 
                });
            }
            
            setTimeout(function() { 
                $(element).tabs(config);
            }, 1); 

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if($(element).data("ui-tabs")){
                    $(element).tabs("destroy");
                }
            });            
            
            retVal = {
                controlsDescendantBindings : false
            };

            return retVal;
        }
    };    
    
    /**
     * tabs jQuery UI Tabs binding valueAccessor format of [{ tabid: String, tabLabel: String}] gives each tab a
     * label and id allBindingsAccessor can contain events, and options as tabEvents : { customBindings : [ {
     * trigger : function, onTrigger : function } ] }, tabsOptions: {} as jquery-ui tab options
     * 
     * 
     */
    logger.debug("Adding tabs binding");
    ko.bindingHandlers.tabs = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var hash, retVal, events = ko.utils.unwrapObservable(allBindingsAccessor().tabEvents) || {
                customBindings : [
                    {
                        trigger : undefined,
                        onTrigger : undefined
                    }
                ]
            }, options = ko.utils.unwrapObservable(allBindingsAccessor().tabsOptions) || {};

            ko.renderTemplate(tabsTemplate, bindingContext.createChildContext(valueAccessor()), {
                templateEngine : stringTemplateEngine
            }, element, "replaceChildren");

            $(element).tabs(options);

            $.each(events.customBindings, function(index, binding) {
                if ( binding.trigger !== undefined ) {
                    logger.debug(binding);
                    $(element).bind(binding.trigger, binding.onTrigger);
                }
            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if($(element).data("ui-tabs")){
                    $(element).tabs("destroy");
                }
            });

            retVal = {
                controlsDescendantBindings : true
            };

            return retVal;
        },
        update : function(element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if ( options ) {
                $(element).tabs(options);
            }
        }
    };

    /**
     * button jQuery UI button binding
     */
    logger.debug("Adding button binding");
    ko.bindingHandlers.button = {
        init : function(element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};
            $(element).button(options);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).button("destroy");
            });
        },
        update : function(element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if ( options ) {
                $(element).button(options);
            }
        }
    };
     
    /**
     * jgplot binding
     * usage
     * data-bind="jqplot: [[1,2,3,4,5,6]], plotOptions { title: 'my graph' }"
     */
    logger.debug("Adding jqplot binding");
    ko.bindingHandlers.jqplot = {
        update : function(element, valueAccessor, allBindings) {
            var data = ko.utils.unwrapObservable(ko.toJS(valueAccessor())),
            plotOptions = ko.utils.unwrapObservable(allBindings().plotOptions),
            target = $(element).attr('id'),
            plot = graphPlots[target];
            
            logger.debug(target, JSON.stringify(data, null, 2), JSON.stringify(plotOptions, null, 2));
                        
            if(data){
                if(plot){
                    plot.destroy();
                }
                
                if(plotOptions){
                    plot = $.jqplot(target, data, plotOptions);
                }else{
                    plot = $.jqplot(target, data);
                }    
                
                graphPlots[target] = plot;
                
                $(document).on('refreshPlot', function(){
                    setTimeout(function(){
                        if(plot._drawCount === 0){
                            plot.replot();                    
                        }                       
                    }, 1);
                });
                
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    plot.destroy();
                });     
            }else{
                if(!$('#noGraph')){
                    $(element).append('<h3 id="noGraph" style="width: 95%; margin: 0 auto; text-align: center;">There is not enough data to create a proper graph, only the results will be displayed</h3>').height('25px');    
                }                
            }
        }
    };    
    
    /**
     * helpButton jQuery UI button binding
     */
    logger.debug("Adding helpButton binding");
    ko.bindingHandlers.helpButton = {
        init : function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {},
            helpType = allBindings().helpType || 'ECM',
            showHelp, hideHelp, modalUiDelegate;

            switch(helpType){
                case "ECM":
                    modalUiDelegate = new HelpModalUiDelegate(new ECMHelpConfig(), viewModel);
                    break;
                case "Report":
                    modalUiDelegate = new HelpModalUiDelegate(new AuditHelpConfig(), viewModel);
                    break;  
                case "Building":
                    modalUiDelegate = new HelpModalUiDelegate(new BuildingHelpConfig(), viewModel);
                    break;                      
                case "Zone":
                    modalUiDelegate = new HelpModalUiDelegate(new ZoneHelpConfig(), viewModel);
                    break;                        
                case "Meter":
                    modalUiDelegate = new HelpModalUiDelegate(new MeterHelpConfig(), viewModel);
                    break;  
            }

            showHelp = modalUiDelegate.showHelp;
            hideHelp = modalUiDelegate.hideAllModalWindows;
            
            $(element).button(options);
            
            $(element).click(showHelp);

            $(document).on("hideHelp", function(event){
                hideHelp();
            });
            
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).button("destroy");
                hideHelp();
            });
        },
        update : function(element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if ( options ) {
                $(element).button(options);
            }
        }
    };    

    /**
     * datepicker jQuery UI datepicker binding
     */
    logger.debug("Adding datepicker binding");
    ko.bindingHandlers.datepicker = {
        init : function(element, valueAccessor, allBindingsAccessor) {
            try {
                var i, options = allBindingsAccessor().datepickerOptions || {}, realOptions = {
                    onClose : function() {
                        this.focus();
                    }
                };
                for ( i in options ) {
                    if ( options.hasOwnProperty(i) ) {
                        if ( options[i].notifySubscribers ) {
                            realOptions[i] = ko.utils.unwrapObservable(options[i]);
                        } else if ( options.hasOwnProperty(i) ) {
                            realOptions[i] = options[i];
                        }
                    }
                }
                $(element).datepicker(realOptions);
                ko.utils.registerEventHandler(element, "change", function() {
                    try {
                        var observable = valueAccessor();
                        if ( observable() !== $(element).val() ) {
                            observable($(element).val());
                        }
                    } catch (e) {
                        logger.error("Error binding to datepicker", e.stack);
                    }
                });
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    $(element).datepicker("destroy");
                });
            } catch (e) {
                logger.error("Error binding to datepicker", e.stack);
            }
        },
        update : function(element, valueAccessor, allBindingsAccessor) {
            try {
                var i, current, value = ko.utils.unwrapObservable(valueAccessor()), options = allBindingsAccessor().datepickerOptions
                        || {}, realOptions = {
                    onClose : function() {
                        this.focus();
                    }
                };
                for ( i in options ) {
                    if ( options.hasOwnProperty(i) ) {
                        if ( options[i].notifySubscribers ) {
                            realOptions[i] = ko.utils.unwrapObservable(options[i]);
                        } else if ( options.hasOwnProperty(i) ) {
                            realOptions[i] = options[i];
                        }
                    }
                }
                current = $(element).datepicker("getDate");
                if ( value - current !== 0 ) {
                    $(element).datepicker("setDate", value);
                }
                $(element).datepicker(realOptions);
            } catch (e) {
                // It was bound to an non observable
                logger.error("Error binding to datepicker", e.stack);
            }
        }
    };

    /**
     * message jQuery UI message binding
     */
    logger.debug("Adding message binding");
    ko.bindingHandlers.message = {
        defaultOptions : {
            splashTimeout : 1000,
            show : "fade",
            hide : "fade"
        },
        update : function(element, valueAccessor) {
            var opt = ko.utils.unwrapObservable(valueAccessor());
            try {
                if ( opt !== null ) {
                    extendLiteral(opt, ko.bindingHandlers.message.defaultOptions);
                    if ( opt.splash ) {
                        ko.bindingHandlers.message.showSplash(opt.splash, opt);
                    } else if ( opt.confirm ) {
                        opt.result = confirm(opt.confirm);
                    } else if ( opt.alert ) {
                        alert(opt.alert);
                    }
                }
            } catch (e) {
                logger.error("ko.bindingHandlers.message.update error", e.stack);
            }
        },
        showSplash : function(text, opt) {
            var splash = $("<div id='splash'/>");
            splash.html(text).appendTo("body").dialog({
                show : opt.show,
                hide : opt.hide,
                close : function() {
                    splash.remove();
                },
                open : function() {
                    setTimeout(function() {
                        splash.dialog("close");
                    }, opt.splashTimeout);
                }
            });
        }
    };

    ko.virtualElements.allowedBindings.message = true;

    /**
     * dialog jQuery UI dialog binding
     */
    logger.debug("Adding dialog binding");
    ko.bindingHandlers.dialog = {
        init : function(element, valueAccessor) {
            var retVal, options = {
                title : 'Notification',
                closeOnEscape : true,
                height : ($(window).height() * 0.75),
                width : ($(window).width() * 0.75),
                show : {
                    effect : 'blind',
                    duration : 250
                },
                hide : {
                    effect : 'blind',
                    duration : 250
                },
                position : {
                    my : "center",
                    at : "center",
                    of : "body"
                }
            };

            if ( valueAccessor() ) {
                $.extend(options, ko.utils.unwrapObservable(ko.toJS(valueAccessor())));
            }

            $.extend(options, {
                beforeClose : function() {
                    ko.utils.domNodeDisposal.removeNode(element);
                }
            });

            logger.warn(options);
            
            $(element).dialog(options);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).dialog("destroy");
            });

            retVal = {
                controlsDescendentBindings : true
            };

            return retVal;
        }
    };

    /**
     * tooltip jQuery UI tooltip binding
     */
    logger.debug("Adding tooltip binding");
    ko.bindingHandlers.tooltip = {
        init : function(element, valueAccessor) {
            var retVal, options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};

            $(element).tooltip(options);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).tooltip("destroy");
            });

            retVal = {
                controlsDescendentBindings : true
            };

            return retVal;
        },
        update : function(element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if ( options ) {
                $(element).tooltip(options);
            }
        }
    };

    /**
     * helpTooltip jQuery UI help tooltip binding
     */
    logger.debug("Adding help tooltip binding");
    ko.bindingHandlers.helpTooltip = {
        init : function(element, valueAccessor) {
            var retVal, options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};

            $.extend(options, {
                position : {
                    my : 'left+20 center',
                    at : 'center'
                },
                items : 'span'
            });
            $(element).tooltip(options);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).tooltip("destroy");
            });

            retVal = {
                controlsDescendentBindings : true
            };

            return retVal;
        },
        update : function(element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if ( options ) {
                $(element).tooltip(options);
            }
        }
    };

    /**
     * accordion jQuery UI accordion binding
     */
    logger.debug("Adding accordion binding");
    ko.bindingHandlers.accordion = {
        init : function(element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};
            setTimeout(function() {
//                $.extend(options, {
//                   event: 'click hoverintent' 
//                });
                
                if(!options.hasOwnProperty('activate')){
                    $.extend(options, {
                        activate: function(e, ui){
                            $(document).trigger('bounce.notifiers');
                            logger.warn(ui);
                        }
                    });                    
                }

                
                $(element).accordion(options);
            }, 1);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).accordion("destroy");
            });
        },
        update : function(element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if ( options ) {
                $(element).accordion(options);
            }
        }
    };
    
    $.event.special.hoverintent = {
        setup: function() {
          $( this ).bind( "mouseover", $.event.special.hoverintent.handler );
        },
        teardown: function() {
          $( this ).unbind( "mouseover", $.event.special.hoverintent.handler );
        },
        handler: function( event ) {
          var currentX, currentY, timeout,
            args = arguments,
            target = $( event.target ),
            previousX = event.pageX,
            previousY = event.pageY;
     
          function track( event ) {
            currentX = event.pageX;
            currentY = event.pageY;
          }
     
          function clear() {
            target
              .unbind( "mousemove", track )
              .unbind( "mouseout", clear );
            clearTimeout( timeout );
          }
     
          function handler() {
            var prop,
              orig = event;
     
            if ( ( Math.abs( previousX - currentX ) +
                Math.abs( previousY - currentY ) ) < 7 ) {
              clear();
     
              event = $.Event( "hoverintent" );
              for ( prop in orig ) {
                if ( !event.hasOwnProperty(prop) ) {
                  event[ prop ] = orig[ prop ];
                }
              }
              // Prevent accessing the original event since the new event
              // is fired asynchronously and the old event is no longer
              // usable (#6028)
              delete event.originalEvent;
     
              target.trigger( event );
            } else {
              previousX = currentX;
              previousY = currentY;
              timeout = setTimeout( handler, 1000 );
            }
          }
     
          timeout = setTimeout( handler, 1000 );
          target.bind({
            mousemove: track,
            mouseout: clear
          });
        }
      };    

    /**
     * accordion jQuery UI selectable binding
     */
    logger.debug("Adding selectable binding");
    ko.bindingHandlers.selectable = {
        init : function(element, valueAccessor, allBindings, model, context) {
            var underlyingObservable = valueAccessor(),
            idTrim = ko.utils.unwrapObservable(ko.toJS(allBindings())).idTrim || {},
            options = ko.utils.unwrapObservable(ko.toJS(allBindings())).selectOptions || {},
            vm;
            
            logger.debug("Selectable Options", JSON.stringify(options, null, 2));
            
            if(underlyingObservable){
                $.extend(options, {
                    selected: function( event, ui ) {
                        var id = ui.selected.id.substring(idTrim.length);
                        underlyingObservable(id);
                    }
                });
            }
            
            setTimeout(function() {
                $(element).selectable(options);
            }, 1);

        }
    };    

    /**
     * progressbar jQuery UI progressbar binding
     */
    logger.debug("Adding progressbar binding");
    ko.bindingHandlers.progressbar = {
        init : function(element, valueAccessor) {
            var value = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || 0;
            
            logger.debug(value);
            setTimeout(function() {
                $(element).progressbar({
                    value : value
                });
            }, 1);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).progressbar("destroy");
            });
        },
        update : function(element, valueAccessor) {
            var value = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || 0;

            setTimeout(function() {
                $(element).progressbar("option", "value", value);
            }, 1);
        }
    };

    /**
     * jQuery UI autocomplete binding
     *      must pass in a url in the options
     *      example : autocomplete: {url:'/path/to/get/list'}
     *      
     *      passing in isIdField:true will convert the current element a hidden field 
     *      that it places the id in, and then creates a new inut to tie the autocomplete too.
     *      example : displayValue: observable, autocomplete: {isIdField:true, url:'/path/to/get/list'}
     *      
     *      Request path should expect a post with data containing 1 input of Type String, Name query
     * 
     *      The response should contain 2 response parameters per item
     *      label and value
     *      [
     *          {
     *              label: 'Label 1', - Label should be a string
     *              value: 'Value 1' - value should be a String
     *          },
     *          {
     *              label: 'Label 2', - Label should be a string
     *              value: 'Value 2' - value should be a String
     *          }
     *      ]
     *      
     *      Should add the following to your CSS to get the loading icon
     *      .ui-autocomplete-loading {
     *          background: white url('/path/to/images/ui-anim_basic_16x16.gif') right center no-repeat;
     *      }
     */
    logger.debug("Adding autocomplete binding");
    ko.bindingHandlers.autocomplete = {
        init : function(element, valueAccessor, allBindingsAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {},
                inputElement, displayValue = allBindingsAccessor().displayValue || function(){},
                boundValue = allBindingsAccessor().value || function(){};

            setTimeout(function() {
                
                if(options.isIdField){
                    inputElement = $(element).clone();
                    $(element).attr('type','hidden');
                    
                    ko.cleanNode($(inputElement));
                    
                    $(inputElement).val(displayValue());
                    $(inputElement).insertAfter($(element));
                    
                    $(inputElement).autocomplete({
                        source : function(request, response) {
                            $.ajax({
                                method: 'post',
                                url : options.url,
                                dataType : "json",
                                contentType: "application/json; charset=UTF-8",
                                global: false,
                                data : JSON.stringify({
                                    query : request.term
                                }),
                                success : function(data) {
                                    response($.map(data, function(item) {
                                        return {
                                            label : item.label,
                                            value : item.value
                                        };
                                    }));
                                }
                            });
                        },
                        minLength : 2,
                        select : function(event, ui) {
                            $(element).val(ui.item.value);
                            boundValue(ui.item.value);
                            
                            setTimeout(function(){
                                displayValue(ui.item.label);
                                $(inputElement).val(ui.item.label);                                        
                            },1);

                        },
                        focus : function(event, ui) {                                    
                            setTimeout(function(){
                                displayValue(ui.item.label);
                                $(inputElement).val(ui.item.label);                                        
                            },1);
                        },
                        open : function() {
                            $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
                        },
                        close : function() {
                            $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
                        }
                    });
                }else{
                    $(element).autocomplete({
                        source : function(request, response) {
                            $.ajax({
                                method: 'post',
                                url : options.url,
                                dataType : "json",
                                contentType: "application/json; charset=UTF-8",
                                global: false,
                                data : JSON.stringify({
                                    query : request.term
                                }),
                                success : function(data) {
                                    response($.map(data, function(item) {
                                        return {
                                            label : item.label,
                                            value : item.value
                                        };
                                    }));
                                }
                            });
                        },
                        minLength : 2,
                        select : function(event, ui) {
                            $(element).val(ui.item.value);
                            
                        },
                        open : function() {
                            $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
                        },
                        close : function() {
                            $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
                        }
                    });
                }
                

            }, 1);
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(inputElement).autocomplete("destroy");
            });
        }
    };

    /**
     * combobox
     * jQuery UI combobox binding 
     * modified version of the autocomplete widget from jQuery UI
     */
    logger.debug("Adding combobox binding");
    ko.bindingHandlers.combobox = {
        init : function (element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};
            setTimeout(function () {
                $(element).combobox(options);
                $(element).removeClass("ui-widget");
            }, 1);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).combobox("destroy");
            });
        },
        update : function (element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if (options) {
                $(element).combobox(options);
                $(element).removeClass("ui-widget");
            }
        }
    };            
    
    /**
     * menu jQuery UI menu binding
     */
    logger.debug("Adding menu binding");
    ko.bindingHandlers.menu = {
        init : function(element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};
            setTimeout(function() {
                $(element).menu(options);
            }, 1);
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).menu("destroy");
            });
        },
        update : function(element, valueAccessor) {
            setTimeout(function() {
                $(element).menu("option", "value", valueAccessor());
            }, 1);
        }
    };
    
    /**
     * menu jQuery UI menu binding
     */
    logger.debug("Adding menu binding");
    ko.bindingHandlers.menuFromButton = {
        init : function(element, valueAccessor, allBindingsAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {},
                menuList = $(element).next();
            
            setTimeout(function() {
                menuList.menu(options).hide();
                $(element).click(function(event){
                    event.stopPropagation();
                    if(menuList.is(":visible")){
                        $(this).find('.ui-icon-triangle-1-n').addClass('ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-n');
                        try{
                            if(!$(event.target).is('.itemIcon > img')){
                                if(menuList.data('ui-menu')){
                                    menuList.fadeOut(); 
                                }
                            }
                        }catch(e){
                            logger.debug(e);
                        }
                    }else{
                        $(this).find('.ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-n').removeClass('ui-icon-triangle-1-s');
                        try{
                            menuList.fadeIn().position({
                                my: "left top",
                                at: "left bottom",
                                of: $(element)
                            });                             
                        }catch(e1){
                            logger.debug(e1);
                        }
                    }
                    
                    if(menuList.is(":visible")){                        
                        $(document).one("click", function(event) {
                            $(element).find('.ui-icon-triangle-1-n').addClass('ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-n');
                            try{
                                if(menuList.data('ui-menu')){
                                    menuList.fadeOut();                                  
                                }
                            }catch(e){
                                logger.debug(e);
                            }            
                        });
                    }
                });

            }, 1);
            
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if(menuList.data('ui-menu')){
                    menuList.menu("destroy");                                
                }
            });
        }
    };
    
    /**
     * fadeIn jQuery UI fadeIn binding
     */
    logger.debug("Adding fadeIn binding");
    ko.bindingHandlers.fadeIn = {
        init : function(element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};
            
            $(element).hide().fadeIn(options);
        }
    };      

    // jQuery UI password strength
    logger.debug("Adding pstrength binding");
    ko.bindingHandlers.pstrength = {
        init : function (element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {},
            passwordRegEx = options.passwordRegEx;
            
            delete options.passwordRegEx;
            
            $(element).pstrength(options);
            
            if(passwordRegEx !== undefined){
                $(element).pstrength.addRule('kayaPassword', function(word, score) {
                    if ( word.length > 0 ) {
                        if ( !word.match(passwordRegEx) ) {
                            $(element).removeClass("passwordValid").addClass("passwordInvalid");
                        } else {
                            $(element).removeClass("passwordInvalid").addClass("passwordValid");
                        }
                    } else {
                        $(element).removeClass("passwordInvalid").removeClass("passwordValid");
                    }
                    return word.match(passwordRegEx) && score;
                }, 0, true);                 
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).pstrength("destroy");
            });
            
            
        }
    };

    // jQuery hasScrolled
    logger.debug("Adding hasScrolled binding");
    ko.bindingHandlers.hasScrolled = {
        update : function(element, valueAccessor, allBindingsAccessor) {
            var underlyingObservable, interceptor,
            elementToEnable = allBindingsAccessor().elementToEnable;
            
            underlyingObservable = valueAccessor();

            $(element).unbind('scroll');
            $(elementToEnable).prop('disabled', false);
            
            if($(element)[0].scrollHeight > 0 && underlyingObservable() !== ''){
                $(elementToEnable).prop('disabled', true);
                $(element).scroll(function() {
                    if($(element).scrollTop() > ($(element)[0].scrollHeight - 810)) {
                        $(elementToEnable).prop('disabled', false);
                    }
                });                 
            }
            
            ko.bindingHandlers.html.update(element, function() {
                return underlyingObservable();
            }, allBindingsAccessor);
        }   
    };    

    // Validation bindings
    ko.bindingHandlers.validateString = {
        init : function (element, valueAccessor) {
            var action = "change cut paste focus blur", 
            config =  {
                    "required": false, 
                    "min": 0, 
                    "max": 255, 
                    "immediate": true
            }, 
            options = ko.unwrap(valueAccessor()) || {};
            
            if (typeof options.required === "boolean") { config.required = options.required; }
            if (typeof options.immediate === "boolean") { config.immediate = options.immediate; }
            if (typeof options.min === "number") { config.min = Math.round(options.min); }
            if (typeof options.max === "number") { config.max = Math.round(options.max); }
            if (config.immediate) {
                action += " keyup";
            }
            $(element).on(action, function () {
                setTimeout(function () {
                    var value = $(element).val();
                    if ((!value && config.required === true) || (value && (value.length > config.max || value.length < config.min))) {
                        $(element).addClass("ui-state-error");
                    } else {
                        $(element).removeClass("ui-state-error");
                    }
                }, 250);
            }).trigger("focus");
        }
    };
    ko.bindingHandlers.validateEmail = {
        init : function (element, valueAccessor) {
            var action = "change cut paste focus blur", config =  {"required": false, "immediate": true}, options = ko.unwrap(valueAccessor()) || {};
            if (typeof options.required === "boolean") { config.required = options.required; }
            if (typeof options.immediate === "boolean") { config.immediate = options.immediate; }
            if (config.immediate) {
                action += " keyup";
            }
            $(element).on(action, function () {
                setTimeout(function () {
                    var value = $(element).val();
                    if ((value && value.match(new RegExp("^.+@.+\\..+$"))) || (!value && !config.required)) {
                        logger.debug("email is valid:", value);
                        $(element).removeClass("ui-state-error");
                    } else {
                        $(element).addClass("ui-state-error");
                    }
                }, 250);
            }).trigger("focus");
        }
    };
    ko.bindingHandlers.validateNumber = {
        init : function (element, valueAccessor) {
            var action = "change cut paste focus blur", config =  {"required": false, "min": Number.NEGATIVE_INFINITY, "max": Number.POSITIVE_INFINITY}, options = ko.unwrap(valueAccessor()) || {};
            if (typeof options.required === "boolean") { config.required = options.required; }
            if (typeof options.min === "number") { config.min = Math.round(options.min); }
            if (typeof options.max === "number") { config.max = Math.round(options.max); }
            if (config.immediate) {
                action += " keyup";
            }
            $(element).on(action, function () {
                setTimeout(function () {
                    var ok = false, value = $(element).val();
                    if (typeof value === "number" && (value >= config.min && value <= config.max)) {
                        ok  = true;
                    } else if (typeof value === "string" && value.match(/^-?(\d+(\.\d*)?|\.\d*)$/)) {
                        value = parseFloat(value, 10);
                        if ((value >= config.min && value <= config.max) || (!value && !config.required)) {
                            ok = true;
                        }
                    } else if (!config.required) {
                        ok = true;
                    }
                    if (!ok) {
                        $(element).addClass("ui-state-error");
                    } else {
                        $(element).removeClass("ui-state-error");
                    }
                }, 250);
            }).trigger("focus");
        }
    };
    ko.bindingHandlers.validatePhone = {
        init : function (element, valueAccessor) {
            var action = "change cut paste focus blur", config =  {"required": false, "immediate": true}, options = ko.unwrap(valueAccessor()) || {};
            if (typeof options.required === "boolean") { config.required = options.required; }
            if (config.immediate) {
                action += " keyup";
            }
            $(element).on(action, function () {
                setTimeout(function () {
                    var value = String($(element).val()).replace(/\D+/g, '');
                    if (value.length === 10 || (value.length === 11 && value.match(/^1/)) || (value.length === 0 && !config.required)) {
                        $(element).removeClass("ui-state-error");
                    } else {
                        $(element).addClass("ui-state-error");
                    }
                }, 250);
            }).trigger("focus");
        }
    };

    ko.bindingHandlers.validateZipCode = {
        init : function (element, valueAccessor) {
            var action = "change cut paste focus blur", config =  {"required": false, "immediate": true}, options = ko.unwrap(valueAccessor()) || {};
            if (typeof options.required === "boolean") { config.required = options.required; }
            if (config.immediate) {
                action += " keyup";
            }
            $(element).on(action, function () {
                setTimeout(function () {
                    var value = String($(element).val()).replace(/\D+/g, '');
                    if (value.length === 9 || value.length === 5 || (value.length === 0 && !config.required)) {
                        $(element).removeClass("ui-state-error");
                    } else {
                        $(element).addClass("ui-state-error");
                    }
                }, 250);
            }).trigger("focus");
        }
    };

    ko.bindingHandlers.validateSelection = {
        init : function (element, valueAccessor) {
            var config =  {"required": false}, options = ko.unwrap(valueAccessor()) || {};
            if (typeof options.required === "boolean") { config.required = options.required; }
            $(element).on("change keyup focus blur", function () {
                setTimeout(function () {
                    var value = String($(element).val());
                    if (value || !config.required) {
                        $(element).removeClass("ui-state-error");
                    } else {
                        $(element).addClass("ui-state-error");
                    }
                }, 10);
            }).trigger("focus");
        }
    };

    ko.bindingHandlers.validateMatches = {
        init : function (element, valueAccessor) {
            var otherSelector =  ko.unwrap(valueAccessor());
            function checkIt() {
                setTimeout(function () {
                    var me, other;
                    me = $(element).val();
                    other = $(otherSelector).val();
                    if (me === other) {
                        $(element).removeClass("ui-state-error");
                    } else {
                        $(element).addClass("ui-state-error");
                    }
                }, 250);
            }
            $(otherSelector).on("change keyup focus blur cut paste", checkIt);
            $(element).on("change keyup focus blur cut paste", checkIt).trigger("focus");
        }
    };
    
    /**
     * scrollbar jQuery scrollbar binding
     */
    logger.debug("Adding scrollbar binding");
    ko.bindingHandlers.scrollbar = {
        init : function(element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};
            
            setTimeout(function(){
                $(element).perfectScrollbar(options);                
            }, 1);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).perfectScrollbar("destroy");
            });
        },
        update : function(element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if ( options ) {
                $(element).perfectScrollbar(options);
            }
        }
    };    
    
    /**
     * Text Counter binding
     */
    logger.debug("Adding countText binding");
    ko.bindingHandlers.countText = {
        init : function(element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {},
                maxChars = options.maxChars || 100,
                maxCharsWarning = options.maxCharsWarning || 90,
                maxWords = options.maxWords || 100,
                maxWordsWarning = options.maxWordsWarning || 90,
                countWords = options.countWords || false;
            
            $(element).textCounter({
                'maxChars' : maxChars,
                'maxCharsWarning' : maxCharsWarning,
                'msgFontSize' : '12px',
                'msgFontColor' : '#000',
                'msgFontFamily' : 'Arial',
                'msgTextAlign' : 'right',
                'msgWarningColor' : '#F00',
                'msgAppendMethod' : 'insertAfter',
                'countWords': countWords,
                'maxWords' : maxWords,
                'maxWordsWarning': maxWordsWarning
            });
        }
    };
    
    /**
     * Jquery UI Draggable binding
     * example
     * <ul data-bind="draggable: 
     *      { 
     *          clone : true, 
     *          target: 'li', 
     *          draggableOptions: { 
     *              cancel: 'a.ui-icon',  
     *              revert: 'invalid',  
     *              containment: 'document' 
     *          }
     * }">
     * clone: this allows you to clone the existing item when dragging (leave in place in original list) 
     * target: this is the draggable target within this element (i.e. 'li')
     * draggableOptions: Any jqueryUI Draggable option
     * 
     */
    ko.bindingHandlers.draggable = {
        update: function(element, valueAccessor, allBindings, model, context){
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {},
            draggableOptions = options.draggableOptions;
            
            // if we are to clone, we set the option
            // clone allows us to drag and drop while leaving the original
            if(options.clone){
                $.extend(draggableOptions, {
                    helper: "clone"
                });
            }
            
            // add the cursor here, this allows a change globally
            $.extend(draggableOptions, {
                cursor: "move"
            });

            // set the options.target to draggable
            $(element).find(options.target).draggable(draggableOptions);   
        }
    };

    /**
     * Jquery UI Droppable binding
     * example
     * <ul data-bind="droppable: 
     *      { 
     *          clone : true, 
     *          callback : function / observable, 
     *          droppableOptions: { 
     *              accept: '{element selector}', 
     *              activeClass: 'class-active'
     *          },
     *          draggableOptions: { 
     *              cancel: 'a.ui-icon',  
     *              revert: 'invalid',  
     *              containment: 'document' 
     *          }
     *      }
     * }">
     * clone: this allows you to clone the existing item when dragging (leave in place in original list) 
     * calback: this the funciton / observable to call
     * droppableOptions: Any jqueryUI Droppable options
     * draggableOptions: Any jqueryUI Draggable options used only when clone is set to true;
     * 
     */
    ko.bindingHandlers.droppable = {
        update: function(element, valueAccessor, allBindings, model, context){
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {},
            droppableOptions = options.droppableOptions,
            draggableOptions = options.draggableOptions;

            if(options.clone){
                $.extend(draggableOptions, {
                    helper: "clone"
                });
                
                // add the cursor here, this allows a change globally
                $.extend(draggableOptions, {
                    cursor: "move"
                });

                $.extend(droppableOptions, {
                    drop: function( event, ui ) {
                        var dragElement = ui.draggable.clone().appendTo($(this));
                        
                        dragElement.draggable(draggableOptions);                            

                        if(options.callback){
                            options.callback(ui.draggable);
                        }
                    }
                });
            }else{
                $.extend(droppableOptions, {
                    drop: function( event, ui ) {
                        if(options.callback){
                            options.callback(ui.draggable);
                        }
                    }
                }); 
            }
            
            $(element).droppable(droppableOptions); 
        }
    };
    
    /**
     * Schedule Drag binding
     */
    logger.debug("Adding Schedule Drag binding");
    ko.bindingHandlers.scheduleDrag = {
        hours : ["12am-1am", "1am-2am", "2am-3am", "3am-4am", "4am-5am", 
                 "5am-6am", "6am-7am", "7am-8am", "8am-9am", "9am-10am", 
                 "10am-11am", "11am-12pm", "12pm-1pm", "1pm-2pm", "2pm-3pm", 
                 "3pm-4pm", "4pm-5pm", "5pm-6pm", "6pm-7pm", "7pm-8pm", 
                 "8pm-9pm", "9pm-10pm", "10pm-11pm", "11pm-12am"],
        days : [0, 1, 2, 3, 4, 5, 6],
        init : function(element, valueAccessor, allBindings, model, context) {
            var underlyingObservable = valueAccessor(),
            label = allBindings().label || '',
            observableName = allBindings().observableName || '',
            availableScheduleObservable = allBindings().availableSchedule || {},
            isPrimary= allBindings().isPrimary || false, i, j,
            scheduleDragBeg = null, scheduleDragEnd = null, dragMode = false,
            vm;
                        
            function updateScheduleDrag(ev) {
                var target, startA, endA, startB, endB, i, j;
                if (scheduleDragBeg) {
                    if (ev.toElement) {
                        target = ev.toElement;
                    } else {
                        target = ev.target;
                    }
                    
                    if ($(target).is('td') && !$(target).hasClass('unavailable')) {
                        scheduleDragEnd = {
                            index: $(target).attr('class').match(/(?:^|\b)(\d+_\d+)(?:$|\b)/)[1].split('_')
                        };
                        startA = Math.min(scheduleDragBeg.index[0], scheduleDragEnd.index[0]);
                        endA = Math.max(scheduleDragBeg.index[0], scheduleDragEnd.index[0]);
                        startB = Math.min(scheduleDragBeg.index[1], scheduleDragEnd.index[1]);
                        endB = Math.max(scheduleDragBeg.index[1], scheduleDragEnd.index[1]);
                        
                        $(element).find('.dragSelected').removeClass('dragSelected');
                        
                        for (i = startA; i <= endA; i += 1) {
                            for (j = startB; j <= endB; j += 1) {
                                $(element).find('.' + i + '_' + j).addClass('dragSelected');
                            }
                        }
                    }
                }
            }
            
            function startScheduleDrag(ev){
                var target;
                if (ev.toElement) {
                    target = ev.toElement;
                } else {
                    target = ev.target;
                }
                
                if ($(target).is('td') && !$(target).hasClass('unavailable')) {
                    scheduleDragBeg = {
                        index: $(target).attr('class').match(/(?:^|\b)(\d+_\d+)(?:$|\b)/)[1].split('_')
                    };
                    dragMode = !$(target).hasClass('selected');
                    
                    updateScheduleDrag(ev);
                }
            }
            
            function endScheduleDrag(ev) {
                var startA, startB, endA, endB, i, j, temp, tempAvail;
                if (scheduleDragBeg) {
                    
                    startA = Math.min(scheduleDragBeg.index[0], scheduleDragEnd.index[0]);
                    endA = Math.max(scheduleDragBeg.index[0], scheduleDragEnd.index[0]);
                    startB = Math.min(scheduleDragBeg.index[1], scheduleDragEnd.index[1]);
                    endB = Math.max(scheduleDragBeg.index[1], scheduleDragEnd.index[1]);
                    
                    temp = underlyingObservable();

                    model.setUndo(observableName, temp);
                    
                    for (i = startA; i <= endA; i += 1) {
                        for (j = startB; j <= endB; j += 1) {
                            temp[j][i] = dragMode;                                
                        }
                    }      
                                        
                    underlyingObservable(temp);
                    
                    if(context.$root.Ecm.selected()){
                        context.$root.Ecm.selected().delayedSave();                        
                    }else if(context.$root.Zone.selected()){
                        context.$root.Zone.selected().delayedSave();                        
                    }
                    
                    $(element).find('.dragSelected').removeClass('dragSelected');
                    
                    scheduleDragBeg = null;
                    scheduleDragEnd = null;
                }
            }  
            
            function getCSS(dayIndex, hourIndex){
                var self = this, ret = 'operationalHoursCell ', tempSchedL, tempSchedR;
                
                if(!isPrimary && availableScheduleObservable()[dayIndex][hourIndex] !== true){
                    return ret + 'unavailable ';
                }
                
                if(underlyingObservable()[dayIndex][hourIndex] === true){
                    ret += 'selected ';                    
                }else if(underlyingObservable === context.$data.operationalHoursB){
                    tempSchedL = context.$data.operationalHoursC();
                    tempSchedR = context.$data.operationalHoursD();
                    
                    if(tempSchedL[dayIndex][hourIndex] === true || tempSchedR[dayIndex][hourIndex] === true){
                        ret += 'unavailable ';
                    }
                    
                }else if(underlyingObservable === context.$data.operationalHoursC){
                    tempSchedL = context.$data.operationalHoursB();
                    tempSchedR = context.$data.operationalHoursD();
                    
                    if(tempSchedL[dayIndex][hourIndex] === true || tempSchedR[dayIndex][hourIndex] === true){
                        ret += 'unavailable ';
                    }                       
                }else if(underlyingObservable === context.$data.operationalHoursD){
                    tempSchedL = context.$data.operationalHoursB();
                    tempSchedR = context.$data.operationalHoursC();
                    
                    if(tempSchedL[dayIndex][hourIndex] === true || tempSchedR[dayIndex][hourIndex] === true){
                        ret += 'unavailable ';
                    }                       
                }

                ret += hourIndex + '_' + dayIndex;
                
                return ret;
            }
            
            vm = {
                    "label": label,
                    "hours": ko.bindingHandlers.scheduleDrag.hours,
                    "days": ko.bindingHandlers.scheduleDrag.days,
                    "getCSS": getCSS
            };
            
            ko.renderTemplate(scheduleTemplate, vm, {
                templateEngine : stringTemplateEngine
            }, element, "replaceChildren");            
            
            $(element).on('mousedown touchstart', function (ev) { 
                startScheduleDrag(ev);
            }).on('mousemove touchmove', function (ev) { 
                updateScheduleDrag(ev); 
            }).on('mouseup touchend', function (ev) { 
                endScheduleDrag(ev); 
            });     
            
            return { controlsDescendantBindings: true };
        }
    };    
    
    
    /**
     * Updateable Image Display binding
     */
    logger.debug("Adding Updateable Image Display binding");
    ko.bindingHandlers.updateableImageDisplay = {
        init : function (element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};
            $(element).attr('src', options.src);

        },
        update : function (element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if (options) {
                $(element).attr('src', options.src);
            }
        }
    };
    
    /**
     * bounce binding
     * options: 
     * 
     * direction: The direction of the effect. Can be "up", "down", "left", "right". Default is "left".
     * distance: Distance to bounce. Default is 50
     * mode: The mode of the effect. Can be "show", "hide" or "effect". Default is "effect".
     * times: Times to bounce. Default is 7.
     * 
     * Bounces the element a specifed number of times.
     * accepts a trigger at the document level to bounce as well.
     * 
     * Additional binding options:
     * bounceSpeed: The time in mils to bounce element - defaults to 750
     * rebounce: The time in mils to rebounce the element - defaults to false (no rebounce)
     */
    logger.debug("Adding bounce binding");
    ko.bindingHandlers.bounce = {
        init : function (element, valueAccessor, allBindingsAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || { times: 7, distance: 50, direction: 'left' },
            bounceSpeed = allBindingsAccessor().bounceSpeed || 750,
            rebounce = allBindingsAccessor().rebounce || false,
            rebounceTimer, bounceDelay = bounceSpeed + 100, isBouncing = false,
            id = guid();
            
            if (options) { 
                logger.debug("bounce binding with id:", id);
                $(document).unbind('bounce.notifiers');
                $(document).on('bounce.notifiers', function(){
                    if(!isBouncing && rebounce){
                        $(element).effect("bounce", options, bounceSpeed);
                    
                        isBouncing = true;
                        setTimeout(function(){
                            isBouncing = false;
                        }, bounceDelay);   
                    }
                });

                $(element).on('bounce.notifiers.' + id, function(evt){
                    if(!isBouncing){
                        $(element).effect("bounce", options, bounceSpeed);
                    
                        isBouncing = true;
                        setTimeout(function(){
                            isBouncing = false;
                        }, bounceDelay);   
                    }
                });                
                
                $(element).trigger('bounce.notifiers.' + id);

                if(rebounce){
                    rebounceTimer = setInterval(function(){
                        $(element).trigger('bounce.notifiers.' + id);
                    }, rebounce);
                }else{
                    clearInterval(rebounceTimer);
                }
                
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    $(element).unbind('bounce.notifiers.' + id);
                    clearInterval(rebounceTimer);
                });
            }
        }
    };    
       
    /**
     * pagedForeach
     */
    logger.debug("Adding pagedForEach Binding");
    ko.bindingHandlers.pagedForeach = {
        preprocess : function(val){
            $("body").removeClass("wait");
            return val;
        },
        init : function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
            var observable = valueAccessor(), allBindings = allBindingsAccessor();
            //reset the pager
            ko.bindingHandlers.pagedForeach.pager = undefined;
            
            defaultPagerIfEmpty(observable);
            checkItemPerPageBinding(allBindings, ko.bindingHandlers.pagedForeach.pager);
            checkTotalItemsBinding(allBindings, ko.bindingHandlers.pagedForeach.pager);
                        
            return ko.bindingHandlers.foreach.init(element, ko.bindingHandlers.pagedForeach.pager.pagedItems);
        },
        update : function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
            var observable = valueAccessor(), allBindings = allBindingsAccessor();
            
            return ko.bindingHandlers.foreach.update(element, ko.bindingHandlers.pagedForeach.pager.pagedItems, allBindingsAccessor, viewModel, bindingContext);
        },
        pager: undefined,
        PageControl : function (){
            var self = this;

            logger.debug("Init PageControl");
            self.page = ko.observable(1);

            self.itemsPerPage = ko.observable(25);
            self.allowChangePageSize = ko.observable(false);
            
            self.totalItems = ko.observable(0);

            self.totalPages = ko.computed(function () {
                return Math.ceil(self.totalItems() / self.itemsPerPage());
            });
            
            self.getPageMethod = ko.observable();
            
            self.pagedItems = ko.computed(function () {
                var itemsPerPage = parseInt(self.itemsPerPage(), 10),
                    page = self.page();
                
                if(!$("body").hasClass('wait')){
                    logger.debug("loading");
                    $("body").addClass("wait");
                    Math.sleep(10);
                } 
                
                logger.debug("pagedItems", itemsPerPage, page);
                
                if(self.getPageMethod()) {
                    return self.getPageMethod()(itemsPerPage, page);  
                }else{
                    return [];                    
                }
            });
            self.relativePages = ko.computed(function () {
                var currentPage = self.page(),
                    totalPages = self.totalPages(),
                    pagesFromEnd = totalPages - currentPage,
                    extraPagesAtFront = Math.max(0, 2 - pagesFromEnd),
                    extraPagesAtEnd = Math.max(0, 3 - currentPage),
                    firstPage = Math.max(1, currentPage - (2 + extraPagesAtFront)),
                    lastPage = Math.min(self.totalPages(), currentPage + (2 + extraPagesAtEnd));

                return ko.utils.range(firstPage, lastPage);
            });
            self.itemsPerPage.subscribe(function (newVal) {
                var n = Math.max(1, Math.ceil(newVal));
                logger.debug("itemsPerPage update", newVal);
                
                if (n !== newVal) {
                    self.itemsPerPage(n);
                }
                self.page(1);
            });
            self.page.subscribe(function (newVal) {
                var n, totalPages;
                
                logger.debug("page update", newVal);
                n = parseInt(newVal, 10);
                totalPages = self.totalPages();
                
                if (n < 1){
                    n = 1;
                } else if (n > 1 && n > totalPages) {
                    n = totalPages;
                }
                                
                if (n !== newVal) {
                    self.page(n);
                }
            });

            self.pagedItems.subscribe(function(o){
                setTimeout(function(){
                    if($("body").hasClass('wait')){
                        logger.debug("finished loading");
                        $("body").removeClass("wait");  
                    }
                }, 1000);
            });  
            
            return self;
        },
        ClientPager: function(observableArray, pager){
            if(!pager) {
                pager = new ko.bindingHandlers.pagedForeach.PageControl();
            }
            
            pager.totalItems(ko.utils.peekObservable(observableArray).length);
            
            pager.getPageMethod(function(itemsPerPage, page){
                var indexOfFirstItemOnCurrentPage = ((page - 1) * itemsPerPage),
                    pageArray;

                pageArray = observableArray.slice(indexOfFirstItemOnCurrentPage, indexOfFirstItemOnCurrentPage + itemsPerPage);
                
                return pageArray;
            });

            if (ko.isObservable(observableArray)){
                var previousSize = 0;
                observableArray.subscribe(function (oldArray) {
                    previousSize = oldArray.length;
                }, pager, "beforeChange");  
                
                observableArray.subscribe(function (newArray) {
                    pager.totalItems(newArray.length);
                    
                    logger.debug("Previous", previousSize, "Current", newArray.length);
                    if(previousSize === 0){
                        setTimeout(function(){
                            if($("body").hasClass('wait')){
                                logger.debug("finished loading");
                                $("body").removeClass("wait");  
                            }
                        }, 1000);
                    }
                    if(previousSize > 0 && previousSize !== newArray.length){
                        pager.page(pager.totalPages());    
                    }
                });                
            }
            
            return pager;
        }
    };
    
    defaultPagerIfEmpty = function (observable) {
        if(ko.bindingHandlers.pagedForeach.pager !== undefined){
            return;
        }else{
            ko.bindingHandlers.pagedForeach.pager = new ko.bindingHandlers.pagedForeach.ClientPager(observable);            
        }
    };

    checkItemPerPageBinding = function(allBindings, pager){
        if (allBindings.pageSize) {
            pager.itemsPerPage(ko.utils.peekObservable(allBindings.pageSize));
                
            if (ko.isObservable(allBindings.pageSize)) {
                allBindings.pageSize.subscribe(function (newVal) {
                    pager.itemsPerPage(newVal);
                });
                pager.itemsPerPage.subscribe(function (newVal) {
                    allBindings.pageSize(newVal);
                });
            }
        }
    };

    checkTotalItemsBinding = function(allBindings, pager){
        if (allBindings.totalItems !== undefined && pager.setTotalItems) {
            pager.setTotalItems(allBindings.totalItems);
        }
    };     
    
    ko.bindingHandlers.pageSizeControl = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var observable = valueAccessor(), allBindings = allBindingsAccessor();
            defaultPagerIfEmpty(observable);
            checkItemPerPageBinding(allBindings, ko.bindingHandlers.pagedForeach.pager);
            checkTotalItemsBinding(allBindings, ko.bindingHandlers.pagedForeach.pager);
            return { 'controlsDescendantBindings': true };
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {            
            ko.bindingHandlers.pagedForeach.pager.allowChangePageSize(true);
            
            // Empty the element
            $(element).html('');

            // Render the page links
            ko.renderTemplate(itemsPerPageTemplate, ko.bindingHandlers.pagedForeach.pager, { templateEngine: stringTemplateEngine }, element);
        }
    };

    ko.bindingHandlers.pageLinks = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var observable = valueAccessor(), allBindings = allBindingsAccessor();
            defaultPagerIfEmpty(observable);
            checkItemPerPageBinding(allBindings, ko.bindingHandlers.pagedForeach.pager);
            checkTotalItemsBinding(allBindings, ko.bindingHandlers.pagedForeach.pager);
            return { 'controlsDescendantBindings': true };
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {            
            // Empty the element
            $(element).html('');

            // Render the page links
            ko.renderTemplate(pagerLinksTemplate, ko.bindingHandlers.pagedForeach.pager, { templateEngine: stringTemplateEngine }, element, "replaceNode");
        }
    };   
        
    /**
     * guid
     */
    guid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.floor(Math.random() * 16), v = c === 'x' ? r : (r % 4) + 8;
            return v.toString(16);
        });
    };
    
    /**
     * extendLiteral
     */
    extendLiteral = function(target, source) {
        var index;
        for ( index in source ) {
            if ( target[index] === null ) {
                target[index] = source[index];
            }
        }

        return target;
    };

    /**
     * writeValueToProperty
     */
    writeValueToProperty = function(property, allBindingsAccessor, key, value, checkIfDifferent) {
        if ( !property || !ko.isWriteableObservable(property) ) {
            var propWriters = allBindingsAccessor().ko_property_writers;
            if ( propWriters && propWriters[key] ) {
                propWriters[key](value);
            }
        } else if ( !checkIfDifferent || property() !== value ) {
            property(value);
        }
    };
    
    /**
     * numeric
     */
    ko.extenders.numeric = function(target, precision) {
        // create a writeable computed observable to intercept writes to our observable
        var result = ko
                .computed({
                    read : target, // always return the original observables value
                    write : function(newValue) {
                        var current = target(), roundingMultiplier = Math.pow(10, precision), newValueAsNum = isNaN(newValue) ? 0
                                : parseFloat(+newValue), valueToWrite = Math.round(newValueAsNum
                                * roundingMultiplier)
                                / roundingMultiplier;
                        // only write if it changed
                        if ( valueToWrite !== current ) {
                            target(valueToWrite);
                        } else {
                            // if the rounded value is the same, but a different value was written, force a
                            // notification for the current field
                            if ( newValue !== current ) {
                                target.notifySubscribers(valueToWrite);
                            }
                        }
                    }
                });
        // initialize with current value to make sure it is rounded appropriately
        result(target());
        // return the new computed observable
        return result;
    };

    /**
     * throttleReadOnly
     */
    ko.extenders.throttleReadOnly = function(b, c) {
        b.throttleEvaluation = c;
        var d = null;
        return ko.computed({
            "read" : b,
            "write" : function(a) {
                clearTimeout(d);
                d = setTimeout(function() {
                    try {
                        b(a);
                    } catch (e) {
                        return false;
                    }
                }, c);
            }
        });
    };  
    
});
