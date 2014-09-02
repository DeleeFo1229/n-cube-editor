/**
 * NCube Editor
 *     IDE for building and editing NCubes
 *
 * @author John DeRegnaucourt
 */

$(function ()
{
    var _cubeList = {};
    var _apps = [];
    var _statuses = ['RELEASE', 'SNAPSHOT'];
    var _versions = [];
    var _selectedCubeName = localStorage[SELECTED_CUBE];
    var _selectedApp = localStorage[SELECTED_APP];
    var _selectedTest = -1;
    var _selectedVersion = localStorage[SELECTED_VERSION];
    var _selectedTab = localStorage[SELECTED_TAB];
    var _testData = null;
    var _selectedStatus = "SNAPSHOT";
    var _axisName;
    var _errorId = null;
    var _colIds = -1;   // Negative and gets smaller (to differentiate on server side what is new)
    var _columnList = $('#editColumnsList');
    var _editor;
    var _activeTab = 'ncubeTab';
    var _jsonEditorMode = 'format';
    var _cellId = null;
    var _uiCellId = null;
    var _urlDropdown = $('#datatypes-url');
    var _valueDropdown = $('#datatypes-value');
    var _editCellCache = $('#editCellCache');
    var _editCellValue = $('#editCellValue');
    var _editCellRadioURL = $('#editCellRadioURL');
    var _editCellModal = $('#editCellModal');

    initialize();

    function initialize()
    {
        loadAppNames();
        loadVersions();
        loadNCubes();
        loadAppListView();
        loadStatusListView();
        loadVersionListView();
        loadNCubeListView();
        setListSelectedStatus(_selectedApp, '#app-list');
        setListSelectedStatus(_selectedStatus, '#status-list');
        setListSelectedStatus(_selectedVersion, '#version-list');
        setListSelectedStatus(_selectedCubeName, '#ncube-list');
        loadCube();

        $.fn.selectRange = function (start, end)
        {
            if (!end)
            {
                end = start;
            }
            return this.each(function ()
            {
                if (this.setSelectionRange)
                {
                    this.focus();
                    this.setSelectionRange(start, end);
                }
                else if (this.createTextRange)
                {
                    var range = this.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', end);
                    range.moveStart('character', start);
                    range.select();
                }
            });
        };
        var west = $('#west');
        var appListDiv = $('#app-list-div');
        var appListPanel = appListDiv.find('> .panel-body');
        appListPanel.height(75);

        var statListDiv = $('#status-list-div');
        var statListPanel = statListDiv.find('> .panel-body');
        statListPanel.height(36);

        var verListDiv = $('#version-list-div');
        var verListPanel = verListDiv.find('> .panel-body');
        verListPanel.height(60);

        var ncubeListPanel = $('#ncube-list-div').find('> .panel-body');

        var hApp = appListDiv.height();
        var hStat = statListDiv.height();
        var hVer = verListDiv.height();

        initJsonEditor();
        addListeners();

        var myLayout;
        var secondaryLayout;

        //            ,   center__paneSelector:	"#testLayoutCenter"
        //            ,	south__paneSelector:	"#testLayoutSouth"
        //            ,	east__paneSelector:		"#testLayoutEast"
        secondaryLayout = $('div#tests').layout({
            name: "secondaryLayout"
            ,   closable:					true	// pane can open & close
            ,	resizable:					true	// when open, pane can be resized
            ,	slidable:					true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
            ,	livePaneResizing:			true
            ,	south__minSize:				100
            ,	east__minSize:				100
            ,	spacing_open:			3  // ALL panes
            ,	spacing_closed:			3 // ALL panes
            ,   center__minWidth:           600
            //            ,	south__spacing_open:			5  // ALL panes
            //,	south__spacing_closed:			5 // ALL panes
        });


        myLayout = $('body').layout({
            name:   "BodyLayout"
            //	reference only - these options are NOT required because 'true' is the default
            ,   closable:					true	// pane can open & close
            ,	resizable:					true	// when open, pane can be resized
            ,	slidable:					true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
            ,	livePaneResizing:			true

            //	some resizing/toggling settings
//            ,	north__slidable:			false	// OVERRIDE the pane-default of 'slidable=true'
//            ,	north__togglerLength_closed: '100%'	// toggle-button is full-width of resizer-bar
//            ,	north__spacing_closed:		20		// big resizer-bar when open (zero height)
//            ,	south__resizable:			false	// OVERRIDE the pane-default of 'resizable=true'
//            ,	south__spacing_open:		0		// no resizer-bar when open (zero height)
//            ,	south__spacing_closed:		20		// big resizer-bar when open (zero height)

            //	some pane-size settings
            //,	west__minSize:				100
//            ,	east__size:					300
//            ,	east__minSize:				200
//            ,	east__maxSize:				.5 // 50% of layout width
            // ,   center__paneSelector: "#center"
            // ,   west__paneSelector: "#west"

            //	some pane animation settings
            ,	west__animatePaneSizing:	false
            ,   west__fxName_open:          "none"
            ,	west__fxName_close:			"none"	// NO animation when closing west-pane
            ,   spacing_open:         3
            ,   spacing_closed:       3
            ,   west__resizeable:           true
            ,   west__size:                 "auto"
            ,   west__minSize:              170
            //	enable showOverflow on west-pane so CSS popups will overlap north pane
            ,	west__showOverflowOnHover:	true
            ,   center__triggerEventsOnLoad: true
            //	enable state management
            ,	stateManagement__enabled:	false // automatic cookie load & save enabled by default
            //           ,	showDebugMessages:			true // log and/or display messages from debugging & testing code
            //,  west__onresize:		"secondaryLayout.resizeAll" // resize ALL visible layouts nested inside
            ,  west__onresize: function()
            {
                ncubeListPanel.height(west.height() - hApp - hStat - hVer - 110);
                secondaryLayout.resizeAll();
//                _editor.resize();
            }

        });

        // after creating the tabs, resize the tabs-wrapper layout...
        // we can access this layout as a 'child' property of the outer-center pane
        //myLayout.center.pane.resizeAll();

        // init ALL the tab-layouts - all use the same options
        // layout-initialization will _complete_ the first time each layout becomes 'visible'
        //$("#tab1").layout( tabLayoutOptions );
        //$("#tab2").layout( tabLayoutOptions );
        //$("#tab3").layout( tabLayoutOptions );


        // resize the tabs layout after creating the tabs
        //secondaryLayout.center.pane.resizeAll(); // resize ONLY the tabs-wrapper layout - faster!

        ncubeListPanel.height(west.height() - hApp - hStat - hVer - 110);

        $(document).on( 'shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
            secondaryLayout.resizeAll();
            //console.log(e.target) // activated tab
        });
        myLayout.resizeAll();
        openGroupContainingLastSelectedNCube();
    }

    function openGroupContainingLastSelectedNCube()
    {
        if (!_selectedCubeName)
        {
            return;
        }
        // Re-open Group containing last-selected cube name
        var groupNode = $("[itemname='" + _selectedCubeName + "']");
        if (groupNode)
        {
            groupNode = groupNode.closest('div.accordion-body');
            if (groupNode)
            {
                groupNode.collapse('show');
            }
        }
    }

    function initJsonEditor()
    {
        // create the editor
        var container = document.getElementById('jsoneditor');
        // TODO: Uncomment 'modes:' below when you figure out how to detect when the drop-down changes, so that
        // you can add back the Save button and remove the 'PoweredBy'

        var options =
        {
            mode: 'code',
//            modes:['code','tree','view','form','text'],
            change: function()
            {
                setDirtyStatus(true);
            }
        };

        // Create JSON Editor (http://jsoneditoronline.org/downloads/)
        _editor = new JSONEditor(container, options);
        var editCtrl = $('#jsoneditor');
        var menu = editCtrl.find('.menu');
        var save = $("<button/>").attr({id:'saveButton', style:'background-image:none;width:64px',title:'Save changes'});
        save.html('Save');
        menu.append(save);           // Add 'Save' button to toolbar
        menu.find('a').remove();     // Get rid of 'Powered by Ace' link
    }

    function setDirtyStatus(dirty)
    {
        var saveButton = $('#saveButton');
        saveButton.prop('disabled', !dirty);
        if (dirty === true)
        {
            saveButton.html('Save*');
        }
        else
        {
            saveButton.html('Save');
        }
    }

    function setTestsDirty(dirty)
    {
        _testsDirty = dirty;
        var saveButton = $('#saveTestButton');

        if (saveButton == null) {
            return;
        }

        saveButton.prop('disabled', !_testsDirty);
        if (_testsDirty === true)
        {
            saveButton.html('Save*');
        }
        else
        {
            saveButton.html('Save');
        }
    }

    function getDirtyStatus()
    {
        var saveButton = $('#saveButton');
        return !saveButton.prop('disabled');
    }

    function addListeners()
    {
        var editor = $('#jsoneditor');
        editor.find(".format").click(function(e)
        {
            _jsonEditorMode = 'format';
        });

        editor.find('.compact').click(function(e)
        {
            _jsonEditorMode = 'compact';
        });

        var saveButton = $('#saveButton');
        saveButton.click(function()
        {
            clearError();
            var result = call("ncubeController.saveJson", [_selectedCubeName, _selectedApp, _selectedVersion, _editor.getText()]);
            if (result.status === true)
            {
                setDirtyStatus(false);
            }
            else
            {
                _errorId = showNote('Error saving JSON n-cube:<hr class="hr-small"/>' + result.data);
            }
        });

        $('#ncubeTab').click(function (e)
        {
            clearError();
            _activeTab = 'ncubeTab';
            loadCube();
        });

        $('#jsonTab').click(function (e)
        {
            clearError();
            _activeTab = "jsonTab";
            loadCube();
        });

        $('#detailsTab').click(function (e)
        {
            clearError();
            _activeTab = "detailsTab";
            loadCube();
        });

        $('#testTab').click(function(e)
        {
            clearError();
            _activeTab = "testTab";
            loadCube();
        });

        $('#picTab').click(function(e)
        {
            clearError();
            _activeTab = "picTab";
            loadCube();
        });

        $('#newCubeMenu').click(function ()
        {
            newCube()
        });
        $('#newCubeSave').click(function ()
        {
            newCubeSave()
        });
        $('#renameCubeMenu').click(function ()
        {
            renameCube();
        });
        $('#renameCubeOk').click(function ()
        {
            renameCubeOk();
        });
        $('#renameTestOk').click(function ()
        {
            renameTestOk();
        });
        $('#dupeCubeMenu').click(function ()
        {
            dupeCube()
        });
        $('#dupeCubeCopy').click(function ()
        {
            dupeCubeCopy()
        });
        $('#deleteCubeMenu').click(function ()
        {
            deleteCube()
        });
        $('#deleteCubeOk').click(function ()
        {
            deleteCubeOk()
        });
        $('#showRefsToMenu').click(function ()
        {
            showRefsToCube()
        });
        $('#showRefsToClose').click(function ()
        {
            showRefsToCubeClose()
        });
        $('#showRefsFromMenu').click(function ()
        {
            showRefsFromCube()
        });
        $('#showRefsFromClose').click(function ()
        {
            showRefsFromCubeClose()
        });
        $('#showReqScopeMenu').click(function ()
        {
            showReqScope()
        });
        $('#showReqScopeClose').click(function ()
        {
            showReqScopeClose()
        });
        $('#releaseCubesMenu').click(function ()
        {
            releaseCubes()
        });
        $('#releaseCubesOk').click(function ()
        {
            releaseCubesOk()
        });
        $('#changeVerMenu').click(function ()
        {
            changeVersion()
        });
        $('#changeVerOk').click(function ()
        {
            changeVersionOk()
        });
        $('#addAxisOk').click(function ()
        {
            addAxisOk()
        });
        $('#deleteAxisOk').click(function ()
        {
            deleteAxisOk()
        });
        $('#updateAxisMenu').click(function ()
        {
            updateAxis()
        });
        $('#updateAxisOk').click(function ()
        {
            updateAxisOk()
        });
        $('#editColSelectAll').click(function ()
        {
            editColSelect(true)
        });
        $('#editColSelectNone').click(function ()
        {
            editColSelect(false)
        });
        $('#editColAdd').click(function ()
        {
            editColAdd()
        });
        $('#editColDelete').click(function ()
        {
            editColDelete()
        });
        $('#editColUp').click(function ()
        {
            editColUp()
        });
        $('#editColDown').click(function ()
        {
            editColDown()
        });
        $('#editColumnsCancel').click(function ()
        {
            editColCancel()
        });
        $('#editColumnsSave').click(function ()
        {
            editColSave()
        });
        $('#generateTestsLink').click(function ()
        {
            loadTestListView("ncubeController.generateTests")
        });
        $('#editCellClear').click(function()
        {
            editCellClear();
        });
        $('#editCellCancel').click(function()
        {
            editCellCancel()
        });
        $('#editCellOk').click(function()
        {
            editCellOK()
        });

        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            // store to local storage.
        });

        $('#saveTestsButton').click(function ()
        {
            saveAllTests();
        });



        _editCellRadioURL.change(function()
        {
            var isUrl = _editCellRadioURL.find('input').is(':checked');
            _urlDropdown.toggle(isUrl);
            _valueDropdown.toggle(!isUrl);
            showHideCacheCheckbox(isUrl);
        });
        _urlDropdown.change(function()
        {
            var isUrl = _editCellRadioURL.find('input').is(':checked');
            showHideCacheCheckbox(isUrl)
        });
    }

    function showHideCacheCheckbox(isUrl)
    {
        var selDataType = _urlDropdown.val();
        var isGroovy = selDataType == 'exp' || selDataType == 'method';
        _editCellCache.toggle(!isGroovy && isUrl);
    }

    function loadAppListView()
    {
        $('#appCount').html(_apps.length);
        var list = $('#app-list');
        list.empty();
        $.each(_apps, function (index, value)
        {
            var li = $("<li/>");
            var anchor = $('<a href="#"/>');
            anchor.click(function ()
            {
                var appName = anchor.text();
                setListSelectedStatus(appName, '#app-list');
                localStorage[SELECTED_APP] = appName;
                _selectedApp = appName;
                loadVersions();
                loadVersionListView();
                loadNCubes();
                loadNCubeListView();
                loadCube();
            });
            anchor.html(value);
            if (value == _selectedApp)
            {
                anchor.attr('class', 'ncube-selected');
            }
            else
            {
                anchor.attr('class', 'ncube-notselected');
            }
            li.append(anchor);
            list.append(li);
        });
    }

    function loadTestListView(funcName)
    {
        var testCtrl = $('#testView');
        testCtrl.empty();
        var testResult = $('#testResult');
        testResult.empty();
        _testData = null;
        _selectedTest = -1;

        if (!_selectedCubeName || !_selectedApp || !_selectedVersion || !_selectedStatus)
        {
            _editor.setText('No n-cube to load');
            setDirtyStatus(false);
            return;
        }

        var testListResult = call(funcName, [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus]);

        if (testListResult.status === true)
        {
            _testData = testListResult.data;
            refreshTestList();
        }
        else {
            var msg = 'Error fetching test data for ' + _selectedCubeName + ' (' + _selectedVersion + ', ' + _selectedStatus + ')';
            if (testListResult.data != null) {
                msg += (':<hr class="hr-small"/>' + testListResult.data);
            }
            _errorId = showNote(msg);
        }
    }

    function refreshTestList() {

        var testListItems = $('#testListItems');
        testListItems.empty();

        if (_testData != null) {
            $('#testListWarning').hide();

            var headerText = $("<h4/>").attr({'class':'list-group-item text-center active'});
            var pHeader = $("<p/>").attr({'class':'list-group-item-text text-center active', 'style':'color:#FFFFFF;'});
            pHeader.html("TESTS");
            headerText.append(pHeader);
            testListItems.append(headerText);

            $.each(_testData, function (index, value) {
                var anchor = $("<a/>").attr({'href':'#', 'class':'list-group-item'});
                var p = $("<p/>").attr({'class':'list-group-item-text'});
                p.html(value['name']);
                anchor.append(p);
                if (index == _selectedTest) {
                    anchor.css( "background-color", "#d9edf7" );
                }
                anchor.click(function() {
                    var testName = anchor.text();
                    _selectedTest = index;
                    changeTestListSelection('#testListItems', index);
                    loadTestView(index);
                });
                testListItems.append(anchor);
                //anchor.html(value['name']);
            });
            $('#testList').fadeIn("fast");
        } else {
            $('#testList').hide();
            $('#testListWarning').fadeIn("fast");
        }
    }

    function loadStatusListView()
    {
        var list = $('#status-list');
        list.empty();
        $.each(_statuses, function (index, value)
        {
            var li = $("<li/>");
            var anchor = $('<a href="#"/>');
            anchor.click(function ()
            {
                var status = anchor.text();
                setListSelectedStatus(status, '#status-list');
                _selectedStatus = status;
                loadVersions();
                loadVersionListView();
                loadNCubes();
                loadNCubeListView();
                loadCube();
                openGroupContainingLastSelectedNCube();
            });
            anchor.html(value);
            if (value == _selectedStatus)
            {
                anchor.attr('class', 'ncube-selected');
            }
            else
            {
                anchor.attr('class', 'ncube-notselected');
            }
            li.append(anchor);
            list.append(li);
        });
    }

    function loadVersionListView()
    {
        $('#verCount').html(_versions.length);
        var list = $('#version-list');
        list.empty();
        $.each(_versions, function (index, value)
        {
            var li = $("<li/>");
            var anchor = $('<a href="#"/>');
            anchor.click(function ()
            {
                var version = anchor.text();
                setListSelectedStatus(version, '#version-list');
                localStorage[SELECTED_VERSION] = version;
                _selectedVersion = version;
                loadNCubes();
                loadNCubeListView();
                loadCube();
                openGroupContainingLastSelectedNCube();
            });
            anchor.html(value);
            if (value == _selectedVersion)
            {
                anchor.attr('class', 'ncube-selected');
            }
            else
            {
                anchor.attr('class', 'ncube-notselected');
            }
            li.append(anchor);
            list.append(li);
        });
    }

    function loadNCubeListView()
    {
        $('#ncubeCount').html(Object.keys(_cubeList).length);
        var groupList = $('#ncube-list');
        groupList.empty();
        $.each(_cubeList, function (key, value)
        {
            var groupName = value['group'];
            var groupNode = $('#ac-' + groupName);
            if (groupNode.length == 0)
            {
                groupNode = $('<div/>').attr({class: 'accordion-group', 'id': 'ac-' + groupName});
                var heading = $("<div/>").attr({class: 'accordion-heading'});
                groupNode.append(heading);
                var anchor = $('<a/>').attr({class: 'accordion-toggle icon-folder-open', 'data-toggle': 'collapse', 'data-parent': 'ncube-list', 'href': '#grp-' + groupName});
                anchor.html(groupName);
                heading.append(anchor);
                groupList.append(groupNode);
                var accordionBody = $('<div/>').attr({class:'accordion-body collapse', 'id':'grp-' + groupName});
                var bodyInner = $('<div/>').attr({class:'accordion-inner'});
                var ul1 = $('<ul/>').attr({class:'nav nav-list'});
                bodyInner.append(ul1);
                accordionBody.append(bodyInner);
                groupNode.append(accordionBody);
                groupList.append(groupNode);
            }

            var ul = groupNode.find('ul');
            var li = $('<li/>');
            var a = $('<a/>').attr({class:'ncube-notselected', 'href':'#','itemName':value['ncube'].name}).html(getSmallCubeName(value));
            a.click(function ()
            {
                clearError();
                var cubeName = a.attr('itemName');
                setListSelectedStatus(cubeName, '#ncube-list');
                localStorage[SELECTED_CUBE] = cubeName;
                _selectedCubeName = cubeName;
                loadCube(); // load spreadsheet side
            });
            ul.append(li);
            li.append(a);
            if (value['ncube'].name == _selectedCubeName)
            {
                a.attr('class', 'ncube-selected');
            }
            else
            {
                a.attr('class', 'ncube-notselected');
            }
        });
    }

    function getSmallCubeName(cubeInfo)
    {
        var prefix = cubeInfo['prefix'];
        return cubeInfo['ncube'].name.substring(prefix.length);
    }

    function loadCubeHtml()
    {
        if (!_selectedCubeName || !_selectedApp || !_selectedVersion || !_selectedStatus)
        {
            $('#ncube-content').html('No n-cubes to load');
            return;
        }
        var result = call("ncubeController.getHtml", [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus]);
        if (result.status === true)
        {
            $('#ncube-content').html(result.data);
            $(".axis-menu").each(function ()
            {
                var element = $(this);
                var axisName = element.attr('data-id');
                var ul = $('<ul/>').prop({'class': 'dropdown-menu', 'role': 'menu'});
                var li = $('<li/>');
                var an = $('<a href="#">');
                an.html("Update Axis...");
                an.click(function ()
                {
                    updateAxis(axisName)
                });
                li.append(an);
                ul.append(li);
                li = $('<li/>');
                an = $('<a href="#">');
                an.html("Add Axis...");
                an.click(function ()
                {
                    addAxis();
                });
                li.append(an);
                ul.append(li);
                li = $('<li/>');
                an = $('<a href="#">');
                an.html("Delete Axis...");
                an.click(function ()
                {
                    deleteAxis(axisName)
                });
                li.append(an);
                ul.append(li);
                li = $('<div/>').prop({'class': 'divider'});
                ul.append(li);
                li = $('<li/>');
                an = $('<a href="#">');
                an.html("Edit " + axisName + " columns...");
                an.click(function ()
                {
                    editColumns(axisName)
                });
                li.append(an);
                ul.append(li);
                element.append(ul);
            });
        }
        else
        {
            $('#ncube-content').empty();
            _errorId = showNote('Unable to load ' + _selectedCubeName + ':<hr class="hr-small"/>' + result.data);
        }

//        $('.column').each(function ()
//        {
//            // TODO: Default must not go into 'edit mode'
//            $(this).on("dblclick", function ()
//            {   // On double click, place into contenteditable mode
//                $(this).attr('contenteditable', 'true');
//                $(this).focus(
//            });
//            $(this).blur(function ()
//            {   // On blur, turn off contenteditable mode
//                var colId = $(this).attr('data-id').split('c')[1];
//                var value = cleanString($(this).html());
//                var result = call("ncubeController.updateColumnCell", [_selectedCubeName, _selectedApp, _selectedVersion, colId, value]);
//                clearError();
//                if (result.status === true)
//                {
//                    $(this).attr('contenteditable', 'false');
//                    $("[data-id='" + $(this).attr('data-id') + "']").each(function ()
//                    {
//                        $(this).html(value);
//                    });
//                }
//                else
//                {
//                    _errorId = showNote('Unable to update column value:<hr class="hr small"/>' + result.data);
//                }
//            });
//        });

        $('.cell').each(function ()
        {
            $(this).on("dblclick", function ()
            {   // On double click open Edit Cell modal
                _uiCellId = $(this);
                var pairs = _uiCellId.attr('data-id').split("_");
                var coord =[];
                for (var i=0; i < pairs.length; i++)
                {
                    coord[coord.length] = pairs[i].split("-");
                }
                _cellId = coord;
                editCell();
            });
        });
    }

    function loadCubeJson()
    {
        if (!_selectedCubeName || !_selectedApp || !_selectedVersion || !_selectedStatus)
        {
            _editor.setText('No n-cube to load');
            setDirtyStatus(false);
            return;
        }
        var result = call("ncubeController.getJson", [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus]);
        if (result.status === true)
        {
            _editor.setText(result.data);
        }
        else
        {
            _editor.setText("Unable to load '" + _selectedCubeName + "'. " + result.data);
        }

        var editCtrl = $('#jsoneditor');
        if (_jsonEditorMode == 'format')
        {
            editCtrl.find('.format').click();
        }
        else
        {
            editCtrl.find('.compact').click();
        }
        setDirtyStatus(false);
    }

    function loadCubeDetails()
    {
        var cube = _cubeList[_selectedCubeName]['ncube'];
        if (!cube)
        {
            return;
        }
        $('#cube_id').val(cube.id);
        $('#cube_app').val(cube.app);
        $('#cube_name').val(cube.name);
        $('#cube_version').val(cube.version);
        $('#cube_status').val(cube.status);
        var date = '';
        if (cube.createDate != undefined)
        {
            date = new Date(cube.createDate.value).format('yyyy-mm-dd HH:MM:ss');
        }
        $('#cube_createDate').val(date);
        date = '';
        if (cube.updateDate != undefined)
        {
            date = new Date(cube.updateDate.value).format('yyyy-mm-dd HH:MM:ss');
        }
        $('#cube_updateDate').val(date);
        $('#cube_createHid').val(cube.createHid);
        $('#cube_updateHid').val(cube.updateHid);
        date = '';
        if (cube.sysEffDate != undefined)
        {
            date = new Date(cube.sysEffDate.value).format('yyyy-mm-dd HH:MM:ss');
        }
        $('#cube_sysEffDate').val(date);
        date = '';
        if (cube.sysEndDate != undefined)
        {
            date = new Date(cube.sysEndDate.value).format('yyyy-mm-dd HH:MM:ss');
        }
        $('#cube_sysEndDate').val(date);
        date = '';
        if (cube.bizEffDate != undefined)
        {
            date = new Date(cube.bizEffDate.value).format('yyyy-mm-dd HH:MM:ss');
        }
        $('#cube_bizEffDate').val(date);
        date = '';
        if (cube.bizEndDate != undefined)
        {
            date = new Date(cube.bizEndDate.value).format('yyyy-mm-dd HH:MM:ss');
        }
        $('#cube_bizEndDate').val(date);
    }

    function loadTestView(index) {

        var testData = _testData[index];

        var testCtrl = $('#testView');
        testCtrl.empty();

        //var well = $("<div/>").attr({'class': 'well'});

        try {

           testCtrl.append(buildTestName(testData['name']));

            $.each(testData['coordDescription'], function (key, value) {
                if (key.substring(0, 1) != "@") {
                    var url = value == null ? null : value['url'];
                    var v = value == null ? null : value['value'];
                    var type = value == null ? null : value['type'];
                    testCtrl.append(buildParameter(key, type, url, v, true));
                }
            });


            var expectedResult = testData['expectedResultDescription'];
            var url = expectedResult == null ? null : expectedResult['url'];
            var v = expectedResult == null ? null : expectedResult['value'];
            var type = expectedResult == null ? null : expectedResult['type'];
            testCtrl.append(buildParameter('expectedResultDescription', type, url, v, false));
        } catch (e) {
            _errorId = showNote('Unable to load test view ' + testData['name'] + ':<hr class="hr-small"/>' + e.message);
        }


        //testCtrl.append(well);
        $('.selectpicker').selectpicker();



        var group = $("<div/>").attr({'class': 'form-group form-group-lg'});
        var buttonDiv = $("<div/>").attr({'class' : 'btn-group col-lg-2 col-lg-offset-10'});
        var runTestButton = $("<button/>").attr({'class' : 'btn btn-primary'});
        runTestButton.text('Run Test');
        runTestButton.click(function ()
        {
            runCubeTest();
        });

        group.append(buttonDiv);
        buttonDiv.append(runTestButton);
        testCtrl.append(group);

    }

    function createTypeSelector(parameterId, typeStr, url) {
        if (typeStr == null) {
            typeStr = 'string';
        }
        var selectorId = parameterId + "-selector"
        var selector = $("<select/>").attr({'class': 'selectpicker show-tick show-menu-arrow col-lg-2', 'data-width': 'auto', 'data-style': 'btn-default', 'id':selectorId});
        return fillTypeSelector(selector, typeStr, url);
    }

    function fillTypeSelector(selector, typeStr, url) {

        if (selector == null) {
            return;
        }
        selector.empty();

        var options = null;

        if (url) {
            options = $('#datatypes-url').find('option');
        } else {
            options = $('#datatypes-value').find('option');
        }

        $.each(options, function (i, value)
        {
            var item = $(value);
            var opt = $("<option/>").attr({'value': item.val()});
            opt.text(item.text());

            if (typeStr != null && typeStr == item.val()) {
                opt.prop({'selected' : true});
            }
            selector.append(opt);
        });

        return selector;
    }

    function buildUrlToggle(coordId, urlIsSelected) {
        var togglediv = $("<div/>").attr({'class' : 'btn-group col-lg-2', 'data-toggle':'buttons'});

        var urlId = coordId + "-url";
        var urlLabel = $("<label/>").attr({'class': 'btn', 'id':urlId});
        var url = $("<input/>").attr({'type':'radio', 'name':'options'});

        urlLabel.append(url);
        urlLabel.text("URL");

        var valueId = coordId + "-non-url";
        var valueLabel = $("<label/>").attr({'class':'btn', 'id':valueId});
        var value = $("<input/>").attr({'type' : 'radio', 'name':'options'});

        valueLabel.append(value);
        valueLabel.text("Value");

        urlLabel.button();
        valueLabel.button();

        togglediv.append(urlLabel);
        togglediv.append(valueLabel);

        if (urlIsSelected) {
            urlLabel.addClass('active');
            urlLabel.prop('checked', true);
            urlLabel.addClass('btn-primary');
            valueLabel.addClass('btn-default');
        } else {
            value.addClass('active');
            valueLabel.prop('checked', true);
            valueLabel.addClass('btn-primary');
            urlLabel.addClass('btn-default');
        }

        urlLabel.click(function ()
        {
            _testsDirty = true;
            urlLabel.removeClass('btn-default');
            urlLabel.addClass('btn-primary');
            valueLabel.addClass('btn-default');
            valueLabel.removeClass('btn-primary');
        });

        valueLabel.click(function ()
        {
            _testsDirty = true;
            valueLabel.removeClass('btn-default');
            valueLabel.addClass('btn-primary');
            urlLabel.addClass('btn-default');
            urlLabel.removeClass('btn-primary');
        });



        return togglediv;
    }

    function buildTestName(name) {
        var labelGroup = $("<div/>").attr({'class': 'form-group form-group-lg col-lg-12'});
        var label = $("<label/>").attr({'for': 'selectedTestName', 'class': 'control-label col-lg-3'});
        label.html("Test");
        labelGroup.append(label);


        var inputdiv = $("<div/>").attr({'class': 'col-lg-5'});
        var input = $("<input/>").attr({'class': 'form-control', 'type': 'text', 'id': 'selectedTestName', 'readonly':'readonly'});
        input.val(name);
        inputdiv.append(input);


        labelGroup.append(inputdiv);


        var renameDiv = $("<div/>").attr({'class' : 'btn-group col-lg-4', 'data-toggle':'buttons'});
        var renameLabel = $("<label/>").attr({'class': 'btn btn-default'});
        var renameButton = $("<input/>").attr({'type':'button' });

        renameLabel.append(renameButton);
        renameLabel.text("Rename");

        renameLabel.button();
        renameDiv.append(renameLabel);
        renameLabel.click(function ()
        {
            renameTest(name);
        });

        labelGroup.append(renameDiv);
        return labelGroup;
        }

    function buildParameter(coordId, type, url, value, append) {
        var parameterId = coordId;

        if (append) {
            parameterId = "test-parameter-" + coordId;
        }
        var labelGroup = $("<div/>").attr({'class': 'form-group form-group-lg col-lg-12', 'id':parameterId});

        var cat = parameterId + "-value";
        var label = $("<label/>").attr({'for': cat, 'class': 'control-label col-lg-3'});
        label.html(coordId);
        labelGroup.append(label);

        var inputdiv = $("<div/>").attr({'class': 'col-lg-3'});
        var input = $("<input/>").attr({'class': 'form-control', 'type': 'text', 'id': cat});

        if (url != null) {
            input.val(url);
        } else if (value != null) {
            input.val(value);
        }
        inputdiv.append(input);


        labelGroup.append(inputdiv);
        labelGroup.append(buildUrlToggle(parameterId, url != null));

        labelGroup.append(createTypeSelector(parameterId, type, url != null));

        return labelGroup;
    }

    function loadCube()
    {
        if (_activeTab == 'ncubeTab')
        {
            loadCubeHtml();
        }
        else if (_activeTab == 'jsonTab')
        {
            loadCubeJson();
        }
        else if (_activeTab == 'detailsTab')
        {
            loadCubeDetails();
        }
        else if (_activeTab == 'testTab')
        {
            loadTestListView("ncubeController.getTests");
        }
        else if (_activeTab == 'picTab')
        {
            // TODO: Load D3.js pictures
        }
        else
        {
            console.log('Unknown tab selected: ' + _activeTab);
        }
    }

    /**
     * Tweak the class name of the selected / non-selected items
     * to match what was selected.
     */
    function setListSelectedStatus(itemName, listId)
    {
        var list = $(listId);
        var items = list.find('li a');
        $.each(items, function (index, value)
        {
            var anchor = $(value);
            var text = anchor.html();
            var elemName = anchor.attr('itemName');
            if (itemName == text || itemName == elemName)
            {
                anchor.attr('class', 'ncube-selected');
            }
            else
            {
                anchor.attr('class', 'ncube-notselected');
            }
        });
    }

    /**
     * Tweak the class name of the selected / non-selected items
     * to match what was selected.
     */
    function changeTestListSelection(listId, selectedItem)
    {
        var list = $(listId);
        var items = list.find('a');
        $.each(items, function (index, value)
        {
            if (_testData != null && index == selectedItem) {
                $(value).css( "background-color", "#d9edf7" );
            } else {
                $(value).css( "background-color", "" );
            }
        });
    }


    /**
     * Load NCube List from Database
     */
    function loadNCubes()
    {
        _cubeList = {};
        clearError();
        if (!_selectedApp)
        {
            _errorId = showNote('No App selected, cannot load n-cubes.');
            return;
        }
        if (!_selectedVersion)
        {
            _errorId = showNote('No Version selected, cannot load n-cubes.');
            return;
        }
        if (!_selectedStatus)
        {
            _errorId = showNote('No Status selected, cannot load n-cubes.');
            return;
        }
        var result = call("ncubeController.getCubeList", ['%', _selectedApp, _selectedVersion, _selectedStatus]);
        var first = null;
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var name = value['ncube'].name;
                _cubeList[name] = value;
                if (!first)
                {
                    first = name;
                }
            });
        }
        else
        {
            _errorId = showNote('Unable to load n-cubes:<hr class="hr-small"/>' + result.data);
        }
        if (!_selectedCubeName || !doesCubeExist())
        {
            _selectedCubeName = (_cubeList && first) ? _cubeList[first]['ncube'].name : null;
        }
    }

    function doesCubeExist()
    {
        var found = false;
        $.each(_cubeList, function(key, value)
        {
            if (key == _selectedCubeName)
            {
                found = true;
            }
        });
        return found;
    }

    function loadVersions()
    {
        _versions = [];
        clearError();
        if (!_selectedApp)
        {
            _errorId = showNote('Unable to load versions, no n-cube App selected.');
            return;
        }
        if (!_selectedStatus)
        {
            _errorId = showNote('Unable to load versions, no n-cube Status selected.');
            return;
        }
        var result = call("ncubeController.getAppVersions", [_selectedApp, _selectedStatus]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                _versions[index] = value;
            });
        }
        else
        {
            _errorId = showNote('Unable to load versions:<hr class="hr-small"/>' + result.data);
        }
        if (!_selectedVersion || !doesVersionExist(_selectedVersion))
        {
            _selectedVersion = (_versions && _versions.length > 0) ? _versions[_versions.length - 1] : null;
        }
    }

    function doesVersionExist(selVer)
    {
        for (var i=0; i < _versions.length; i++)
        {
            if (_versions[i] == selVer)
            {
                return true;
            }
        }
        return false;
    }

    function loadAppNames()
    {
        _apps = [];
        clearError();
        var result = call("ncubeController.getAppNames", []);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                _apps[index] = value;
            });
        }
        else
        {
            _errorId = showNote('Unable to load n-cube Apps:<hr class="hr-small"/>' + result.data);
        }
        if (!_selectedApp && _apps)
        {
            _selectedApp = _apps[0];
            localStorage[SELECTED_APP] = _selectedApp;
        }
        if (!_apps)
        {
            _selectedApp = localStorage[SELECTED_APP] = null;
        }
        else if (!doesItemExist(_selectedApp, _apps) && _apps.length > 0)
        {
            _selectedApp = _apps[0];
        }
    }

    function newCube()
    {
        clearError();
        $('#newCubeAppName').val(_selectedApp);
        $('#newCubeStatus').val('SNAPSHOT');
        $('#newCubeVersion').val(_selectedVersion);
        buildDropDown('#newCubeAppList', '#newCubeAppName', _apps, function (app)
        {
            var result = call("ncubeController.getAppVersions", [app, 'SNAPSHOT']);
            if (result.status === true)
            {
                buildDropDown('#existVersionList', '#newCubeVersion', result.data, function ()
                {
                });
            }
            else
            {
                _errorId = showNote('Failed to load App versions:<hr class="hr-small"/>' + result.data);
            }
        });
        buildDropDown('#existVersionList', '#newCubeVersion', _versions, function ()
        {
        });
        $('#newCubeModal').modal();
    }

    function newCubeSave()
    {
        $('#newCubeModal').modal('hide');
        var appName = $('#newCubeAppName').val();
        var cubeName = $('#newCubeName').val();
        var version = $('#newCubeVersion').val();
        var result = call("ncubeController.createCube", [cubeName, appName, version]);
        if (result.status === true)
        {
            loadAppNames();
            _selectedApp = appName;
            loadAppListView();
            setListSelectedStatus(_selectedApp, '#app-list')
            var saveSelectedVersion = _selectedVersion;
            loadVersions();
            _selectedVersion = doesItemExist(saveSelectedVersion, _versions) ? saveSelectedVersion : _selectedVersion;
            loadVersionListView();
            setListSelectedStatus(_selectedVersion, '#version-list');
            loadNCubes();
            loadNCubeListView();
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to create n-cube '" + cubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function deleteCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Nothing to delete.');
            return;
        }
        $('#deleteCubeLabel').html('Delete \'' + _selectedCubeName + '\' (' + _selectedVersion + ', ' + _selectedStatus + ') ?');
        $('#deleteCubeModal').modal();
    }

    function deleteCubeOk()
    {
        $('#deleteCubeModal').modal('hide');
        var result = call("ncubeController.deleteCube", [_selectedCubeName, _selectedApp, _selectedVersion]);
        if (result.status === true)
        {
            loadAppNames();
            loadAppListView();
            setListSelectedStatus(_selectedApp, '#app-list')
            var saveSelectedVersion = _selectedVersion;
            loadVersions();
            _selectedVersion = doesItemExist(saveSelectedVersion, _versions) ? saveSelectedVersion : _selectedVersion;
            loadVersionListView();
            setListSelectedStatus(_selectedVersion, '#version-list');
            loadNCubes();
            loadNCubeListView();
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to delete n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function renameTest(test)
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Nothing to rename.');
            return;
        }
        $('#renameTestOldName').val(test);
        $('#renameTestNewName').val("");
        $('#renameTestLabel').html('Rename \'' + test + '\'?');
        $('#renameTestModal').modal();
    }


    function renameCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Nothing to rename.');
            return;
        }
        $('#renameCubeAppName').val(_selectedApp);
        $('#renameCubeVersion').val(_selectedVersion);
        $('#renameCubeName').val(_selectedCubeName);
        $('#renameCubeLabel').html('Rename \'' + _selectedCubeName + '\' (' + _selectedVersion + ', ' + _selectedStatus + ') ?');
        $('#renameCubeModal').modal();
    }

    function renameCubeOk()
    {
        $('#renameCubeModal').modal('hide');
        var oldName = $('#renameCubeName').val();
        var newName = $('#renameNewCubeName').val();
        var newApp = $('#renameCubeAppName').val();
        var newVersion = $('#renameCubeVersion').val();
        var result = call("ncubeController.renameCube", [oldName, newName, newApp, newVersion]);
        if (result.status === true)
        {
            loadAppNames();
            _selectedApp = newApp;
            loadAppListView();
            _selectedStatus = 'SNAPSHOT';
            setListSelectedStatus('SNAPSHOT', '#status-list')
            loadVersions();
            _selectedVersion = newVersion;
            loadVersionListView();
            setListSelectedStatus(_selectedVersion, '#version-list');
            loadNCubes();
            _selectedCubeName = newName;
            loadNCubeListView();
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to rename n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function testNameAlreadyExists(name) {

        if (_testData == null) {
            return false;
        }

        var found = false;
        $.each(_testData, function (index, value)
        {
            if (value['name'] == name) {
                found = true;
            }
        });

        return found;
    }

    function validateTestName(name) {
        var nameRegex = /^([A-Za-z0-9-.]{3,64})$/g;

        if (!nameRegex.test(name)) {
            _errorId = showNote("Test name is invalid. Test names can only contain letters, numbers, and, ., and -");
            return false;
        }

        if (testNameAlreadyExists(name)) {
            _errorId = showNote("There is already a test with that name.  Please rename and try again.");
            return false;
        }

        return true;
    }

    function renameTestOk()
    {
        clearError();
        var oldName = $('#renameTestOldName').val();
        var newName = $('#renameTestNewName').val();

        if (!validateTestName(newName)) {
            return;
        }

        $('#renameTestModal').modal('hide');

        _testsDirty = true;

        // change name of selected itm
        var item = $('#selectedTestName');
        if (item != null) {
            item.val(newName);
        }

        // change currently selected model item
        var test = _testData[_selectedTest];
        test["name"] = newName;

        // change in our list.
        refreshTestList();
    }

    function dupeCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Nothing to duplicate.');
            return;
        }
        $('#dupeCubeAppName').val(_selectedApp);
        $('#dupeCubeVersion').val(_selectedVersion);
        $('#dupeCubeName').val(_selectedCubeName);
        $('#dupeCubeLabel').html('Duplicate \'' + _selectedCubeName + '\' (' + _selectedVersion + ', ' + _selectedStatus + ') ?');
        buildDropDown('#dupeCubeAppList', '#dupeCubeAppName', _apps, function (app)
        {
            var result = call("ncubeController.getAppVersions", [app, 'SNAPSHOT']);
            if (result.status === true)
            {
                buildDropDown('#dupeCubeVersionList', '#dupeCubeVersion', result.data, function ()
                {
                });
            }
            else
            {
                _errorId = showNote('Unable to load App versions:<hr class="hr-small"/>' + result.data);
            }
        });
        buildDropDown('#dupeCubeVersionList', '#dupeCubeVersion', _versions, function ()
        {
        });
        $('#dupeCubeModal').modal();
    }

    function dupeCubeCopy()
    {
        $('#dupeCubeModal').modal('hide');
        var newName = $('#dupeCubeName').val();
        var newApp = $('#dupeCubeAppName').val();
        var newVersion = $('#dupeCubeVersion').val();
        var result = call("ncubeController.duplicateCube", [newName, _selectedCubeName, newApp, _selectedApp, newVersion, _selectedVersion, _selectedStatus]);
        if (result.status === true)
        {
            loadAppNames();
            _selectedApp = newApp;
            loadAppListView();
            _selectedStatus = 'SNAPSHOT';
            setListSelectedStatus('SNAPSHOT', '#status-list');
            loadVersions();
            _selectedVersion = newVersion;
            loadVersionListView();
            setListSelectedStatus(_selectedVersion, '#version-list');
            loadNCubes();
            _selectedCubeName = newName;
            loadNCubeListView();
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to duplicate n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function showRefsToCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. No (inbound) references to show.');
            return;
        }
        $('#showRefsToLabel').html('Inbound refs to \'' + _selectedCubeName + '\' (' + _selectedVersion + ', ' + _selectedStatus + ')');
        var ul = $('#refsToCubeList');
        ul.empty();
        $('#showRefsToCubeModal').modal();
        var result = call("ncubeController.getReferencesTo", [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $("<li/>").attr({'class': 'list-group-item'});
                var anchor = $('<a href="#"/>');
                anchor.html(value);
                anchor.click(function ()
                {
                    showRefsToCubeClose();
                    _selectedCubeName = value;
                    setListSelectedStatus(_selectedCubeName, '#ncube-list');
                    loadCube();
                });
                li.append(anchor);
                ul.append(li);
            });
        }
        else
        {
            _errorId = showNote('Error fetching inbound references to ' + _selectedCubeName + ' (' + _selectedVersion + ', ' + _selectedStatus + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function showRefsToCubeClose()
    {
        $('#showRefsToCubeModal').modal('hide');
    }

    function showRefsFromCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. No (outbound) references to show.');
            return;
        }
        $('#showRefsFromLabel').html('Outbound refs of \'' + _selectedCubeName + '\' (' + _selectedVersion + ', ' + _selectedStatus + ')');
        var ul = $('#refsFromCubeList');
        ul.empty();
        $('#showRefsFromCubeModal').modal();
        var result = call("ncubeController.getReferencesFrom", [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $("<li/>").attr({'class': 'list-group-item'});
                var anchor = $('<a href="#"/>');
                anchor.html(value);
                anchor.click(function ()
                {
                    showRefsFromCubeClose();
                    _selectedCubeName = value;
                    setListSelectedStatus(_selectedCubeName, '#ncube-list');
                    loadCube();
                });
                li.append(anchor);
                ul.append(li);
            });
        }
        else
        {
            _errorId = showNote('Error fetching outbound references for ' + _selectedCubeName + ' (' + _selectedVersion + ', ' + _selectedStatus + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function showRefsFromCubeClose()
    {
        $('#showRefsFromCubeModal').modal('hide');
    }

    function showReqScope()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. No required scope to show.');
            return;
        }
        $('#showReqScopeLabel').html('Scope for \'' + _selectedCubeName + '\' (' + _selectedVersion + ', ' + _selectedStatus + ')');
        var ul = $('#reqScopeList');
        ul.empty();
        $('#showReqScopeModal').modal();
        var result = call("ncubeController.getRequiredScope", [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $("<li/>").attr({'class': 'list-group-item'});
                li.html(value);
                ul.append(li);
            });
        }
        else
        {
            _errorId = showNote('Error fetching required scope for ' + _selectedCubeName + ' (' + _selectedVersion + ', ' + _selectedStatus + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function showReqScopeClose()
    {
        $('#showReqScopeModal').modal('hide');
    }

    function releaseCubes()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. No version to release.');
            return;
        }
        if (_selectedStatus == "RELEASE")
        {
            _errorId = showNote('Only a SNAPSHOT version can be released.');
            return;
        }
        $('#releaseCubesLabel').html('Release ' + _selectedApp + ' ' + _selectedVersion + ' SNAPSHOT ?');
        $('#releaseCubesAppName').val(_selectedApp);
        $('#releaseCubesModal').modal();
    }

    function releaseCubesOk()
    {
        $('#releaseCubesModal').modal('hide');
        var newSnapVer = $('#releaseCubesVersion').val();
        var result = call("ncubeController.releaseCubes", [_selectedApp, _selectedVersion, newSnapVer]);
        if (result.status === true)
        {
            var saveSelectedVersion = _selectedVersion;
            loadVersions();
            _selectedVersion = doesItemExist(saveSelectedVersion, _versions) ? saveSelectedVersion : _selectedVersion;
            loadVersionListView();
            loadNCubes();
            loadNCubeListView();
            setListSelectedStatus(_selectedCubeName, '#ncube-list');
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to release version '" + _selectedVersion + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function changeVersion()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. No SNAPSHOT version can be changed.');
            return;
        }
        if (_selectedStatus == "RELEASE")
        {
            _errorId = showNote('Only a SNAPSHOT version can be changed.');
            return;
        }
        $('#changeVerLabel').html('Change ' + _selectedApp + ' ' + _selectedVersion + ' ?');
        $('#changeVerModal').modal();
    }

    function changeVersionOk()
    {
        $('#changeVerModal').modal('hide');
        var newSnapVer = $('#changeVerValue').val();
        var result = call("ncubeController.changeVersionValue", [_selectedApp, _selectedVersion, newSnapVer]);
        if (result.status === true)
        {
            loadVersions();
            _selectedVersion = doesItemExist(newSnapVer, _versions) ? newSnapVer : _selectedVersion;
            loadVersionListView();
            loadNCubes();
            loadNCubeListView();
            setListSelectedStatus(_selectedCubeName, '#ncube-list');
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to change SNAPSHOT version to value '" + newSnapVer + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function addAxis()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Axis cannot be added.');
            return;
        }
        if (_selectedStatus == "RELEASE")
        {
            _errorId = showNote('Only a SNAPSHOT version can be modified.');
            return;
        }
        var generalTypes = ['STRING', 'LONG', 'BIG_DECIMAL', 'DOUBLE', 'DATE', 'COMPARABLE'];
        var ruleTypes = ['EXPRESSION'];
        buildDropDown('#addAxisTypeList', '#addAxisTypeName', ['DISCRETE', 'RANGE', 'SET', 'NEAREST', 'RULE'], function (selected)
        {
            if ("RULE" == selected)
            {
                buildDropDown('#addAxisValueTypeList', '#addAxisValueTypeName', ruleTypes, function () { });
                $('#addAxisValueTypeName').val('EXPRESSION');
            }
            else
            {
                buildDropDown('#addAxisValueTypeList', '#addAxisValueTypeName', generalTypes, function () { });
                $('#addAxisValueTypeName').val('STRING');
            }
        });
        buildDropDown('#addAxisValueTypeList', '#addAxisValueTypeName', generalTypes, function () { });
        $('#addAxisName').val('');
        $('#addAxisModal').modal();
    }

    function addAxisOk()
    {
        $('#addAxisModal').modal('hide');
        var axisName = $('#addAxisName').val();
        var axisType = $('#addAxisTypeName').val();
        var axisValueType = $('#addAxisValueTypeName').val();
        var result = call("ncubeController.addAxis", [_selectedCubeName, _selectedApp, _selectedVersion, axisName, axisType, axisValueType]);
        if (result.status === true)
        {
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to add axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function deleteAxis(axisName)
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Axis cannot be deleted.');
            return;
        }
        if (_selectedStatus == "RELEASE")
        {
            _errorId = showNote('Only a SNAPSHOT version can be modified.');
            return;
        }
        $('#deleteAxisName').val(axisName);
        $('#deleteAxisModal').modal();
    }

    function deleteAxisOk()
    {
        $('#deleteAxisModal').modal('hide');
        var axisName = $('#deleteAxisName').val();
        var result = call("ncubeController.deleteAxis", [_selectedCubeName, _selectedApp, _selectedVersion, axisName]);
        if (result.status === true)
        {
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to delete axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function findCurrentTest() {
        var temp = null;
        $.each(_testData, function (index, value)
        {
            if (value['name'] == _selectedTest) {
                return temp = value;
            }
        });
        return temp;
    }

    function saveAllTests()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Axis cannot be updated.');
            return;
        }

        if (_testData == null)
        {
            _errorId = showNote('No test selected.  Test cannot be run.');
            return;
        }

        var test = getActiveTest();

        //  If a test is currently selected
        if (test != null) {
            //  locate test in list to add it in...and add it before saving.
            var oldTest = _testData[_selectedTest];
            if (test["name"] == oldTest["name"]) {
                _testData[_selectedTest] = test;
            }
        }

        var result = call("ncubeController.saveTests", [_selectedCubeName, _selectedApp, _selectedVersion, _testData]);
        if (result.status === true)
        {
            _testsDirty = true;
        }
        else
        {
            _errorId = showNote("Unable to save TestData:<hr class=\"hr-small\"/>" + result.data);
        }

    }

    function getActiveTest()
    {
        var test = {};

        var name = $("#selectedTestName").val();

        if (name == null) {
            return null;
        }

        test["name"] = name;
        test["@type"] = "com.cedarsoftware.ncube.NCubeTest";

        var elements = $("#testView > div[id^='test-parameter']");

        var coord = {};

        $.each(elements, function (index, value)
        {
            var id = value.id;
            var parameterId = id.replace("test-parameter-", "");
            coord[parameterId] = retrieveParameter(id);
        });

        test["coordDescription"] = coord;

        var results = $("#testView > div[id='expectedResultDescription']");
        $.each(results, function (index, value)
        {
            var id = value.id;
            test[id] = retrieveParameter(id);
        });

        return test;
    }

    function retrieveParameter(id) {
        var parameter = {};

        var item = $("#" + id + "-value").val();
        var url = $("#" + id + "-url").hasClass("btn-primary");
        var type = $("#" + id + "-selector").val();

        if (url)
        {
            parameter["url"] = item;
        }
        else
        {
            parameter["value"] = item;
        }

        parameter["type"] = type;

        return parameter;
    }

    function runCubeTest() {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus) {
            _errorId = showNote('No n-cube selected. Test cannot be run.');
            return;
        }

        if (_testData == null || _selectedTest == -1) {
            _errorId = showNote('No test selected.  Test cannot be run.');
            return;
        }

        try {
            var currentTest = _testData[_selectedTest];

            var test = getActiveTest();
            var result = call("ncubeController.runTest", [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus, test]);

            if (result.status != true) {
                _errorId = showNote("Could not run cube test '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
                return;
            }


            var resultPane = $('#testResult');
            resultPane.hide();
            resultPane.empty();
            resultPane.append(createTestResult(result.status, result.data));
            resultPane.fadeIn("fast");
        } catch (e) {
            _errorId = showNote("Could not run cube test '" + axisName + "':<hr class=\"hr-small\"/>" + e.message);
        }
    }

    function createTestResult(success, data) {
        var panel;
        var p = $('<p/>');


        var header = $('<div/>').prop({class: "panel-heading"});
        if (success) {
            var item = null;
            try {
                item = $.parseJSON(data);
            } catch (e) {
                _errorId = showNote("Error parsing message :<hr class=\"hr-small\"/>" + e.message);
            }

            header.html("Result");
            panel = $('<div/>').prop({class: "panel"});
            if (item["status"] == "Success") {
                panel.addClass("panel-success");
            } else {
                panel.addClass("panel-danger");
            }
            p.html(item["message"]);
        } else {
            panel = $('<div/>').prop({class: "panel panel-danger"});
            header.html("Failure");
            p.html(data);
        }

        var body = $('<div/>').prop({class: "panel-body"});
        body.append(p);
        panel.append(header);
        panel.append(body);
        return panel;
    }

    function updateAxis(axisName)
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Axis cannot be updated.');
            return;
        }
        if (_selectedStatus == "RELEASE")
        {
            _errorId = showNote('Only a SNAPSHOT version can be modified.');
            return;
        }
        var result = call("ncubeController.getAxis", [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus, axisName]);
        var axis;
        if (result.status === true)
        {
            axis = result.data;
        }
        else
        {
            _errorId = showNote("Could not retrieve axes for ncube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        var forceState = axis.type.name == 'RULE';
        $('#updateAxisLabel').html("Update Axis: " + axisName);
        $('#updateAxisName').val(axisName);
        $('#updateAxisTypeName').val(axis.type.name);
        $('#updateAxisValueTypeName').val(axis.valueType.name);
        $('#updateAxisDefaultCol').prop({'checked': axis.defaultCol != null});
        if (forceState)
        {
            $('#updateAxisSortOrderRow').hide();
        }
        else
        {
            $('#updateAxisSortOrderRow').show();
            $('#updateAxisSortOrder').prop({'checked': axis.preferredOrder == 0, 'disabled': false});
        }
        _axisName = axisName;
        $('#updateAxisModal').modal();
    }

    function updateAxisOk()
    {
        $('#updateAxisModal').modal('hide');
        var axisName = $('#updateAxisName').val();
        var hasDefault = $('#updateAxisDefaultCol').prop('checked');
        var sortOrder = $('#updateAxisSortOrder').prop('checked');
        var result = call("ncubeController.updateAxis", [_selectedCubeName, _selectedApp, _selectedVersion, _axisName, axisName, hasDefault, sortOrder]);
        if (result.status === true)
        {
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to update axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function loadColumns(axis)
    {
        _columnList.empty();
        var axisList = axis.columns['@items'];
        $.each(_columnList.find('.form-control'), function(key, item)
        {
            axisList[key].value = item.value;
        });
        _columnList.empty();
        _columnList.prop('model', axis);
        var displayOrder = 0;
        $.each(axis.columns["@items"], function (key, item)
        {
            delete item['@type'];
            if (!item.displayOrder || item.displayOrder < 2147483647)
            {   // Don't add default column in
                item.displayOrder = displayOrder++;
                var rowDiv = $('<div/>').prop({class: "row", "model": item});
                var div = $('<div/>').prop({class: "input-group"});
                var span = $('<span/>').prop({class: "input-group-addon"});
                var inputBtn = $('<input/>').prop({class: "editColCheckBox", "type": "checkbox"});
                if (item.checked === true)
                {
                    inputBtn[0].checked = true;
                }
                var inputText = $('<input/>').prop({class: "form-control", "type": "text"});
                inputText.blur(function()
                {
                    item.value = inputText.val();
                });

                // TODO: Need to format Range, Set, Nearest, Rule?
                inputText.val(item.value);
                span.append(inputBtn);
                div.append(span);
                div.append(inputText);
                rowDiv.append(div);
                _columnList.append(rowDiv);
            }
        });
    }

    function editColumns(axisName)
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Columns cannot be edited.');
            return;
        }
        if (_selectedStatus == "RELEASE")
        {
            _errorId = showNote('Only a SNAPSHOT version can be modified.');
            return;
        }
        var result = call("ncubeController.getAxis", [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus, axisName]);
        var axis;
        if (result.status === true)
        {
            axis = result.data;
            delete axis['@type'];
            if (!axis.columns['@items'])
            {
                axis.columns['@items'] = [];
            }
            if (axis.defaultCol)
            {   // Remove actual Default Column object (not needed, we can infer it from Axis.defaultCol field being not null)
                axis.columns["@items"].splice(axis.columns["@items"].length - 1, 1);
            }
        }
        else
        {
            _errorId = showNote("Could not retrieve axes for n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        sortColumns(axis);
        loadColumns(axis);
        var moveBtnAvail = axis.preferredOrder == 1;
        if (moveBtnAvail === true)
        {
            $('#editColUp').show();
            $('#editColDown').show();
        }
        else
        {
            $('#editColUp').hide();
            $('#editColDown').hide();
        }
        $('#editColumnsLabel').html('Edit ' + axisName);
        $('#editColumnsModal').modal();
    }

    function sortColumns(axis)
    {
        if (axis.preferredOrder == 1)
        {
            axis.columns['@items'].sort(function(a, b)
            {
                return a.displayOrder - b.displayOrder;
            });
        }
    }

    // Check all or uncheck all column check boxes
    function editColSelect(state)
    {
        var input = $('.editColCheckBox');
        $.each(input, function (index, btn)
        {
            $(this).prop('checked', state);
        });
    }

    function editColAdd()
    {
        var input = $('.editColCheckBox');
        var loc = -1;
        $.each(input, function (index, btn)
        {
            if ($(this).prop('checked'))
            {
                loc = index;
            }
        });
        var axis = _columnList.prop('model');
        var newCol = {
            '@type': 'com.cedarsoftware.ncube.Column',
            'value': 'newValue',
            'id': getUniqueId()
        };

        if (loc == -1 || axis.preferredOrder == 0)
        {
            axis.columns['@items'].push(newCol);
            loc = input.length - 1;
        }
        else
        {
            axis.columns['@items'].splice(loc + 1, 0, newCol);
        }
        loadColumns(axis);

        // Select newly added column name, so user can just type over it.
        input = $('#editColumnsList').find('.form-control');
        input[loc + 1].select();
    }

    function editColDelete()
    {
        var axis = _columnList.prop('model');
        var input = $('.editColCheckBox');
        var cols = axis.columns['@items'];
        var colsToDelete = [];
        $.each(input, function (index, btn)
        {
            if ($(this).prop('checked'))
            {
                colsToDelete.push(index);
            }
        });

        // Walk through in reverse order, deleting from back to front so that
        // the correct elements are deleted.
        for (var i=colsToDelete.length - 1; i >= 0; i--)
        {
            cols.splice(colsToDelete[i], 1);
        }
        loadColumns(axis);
    }

    function editColUp()
    {
        var axis = _columnList.prop('model');
        var cols = axis.columns['@items'];
        var input = $('.editColCheckBox');

        if (cols && cols.length > 0 && input[0].checked)
        {   // Top one checked, cannot move any items up
            return;
        }

        for (var i=0; i < input.length - 1; i++)
        {
            var tag = input[i];
            cols[i].checked = tag.checked;
            if (!tag.checked)
            {
                var nextTag = input[i + 1];
                cols[i + 1].checked = nextTag.checked;
                if (nextTag.checked)
                {
                    tag.checked = true;
                    nextTag.checked = false;

                    var temp = cols[i];
                    cols[i] = cols[i + 1];
                    cols[i + 1] = temp;

                    cols[i].checked = true;
                    cols[i + 1].checked = false;
                }
            }
        }

        loadColumns(axis);
    }

    function editColDown()
    {
        var axis = _columnList.prop('model');
        var cols = axis.columns['@items'];
        var input = $('.editColCheckBox');

        if (cols && cols.length > 0 && input[cols.length - 1].checked)
        {   // Bottom one checked, cannot move any items down
            return;
        }

        for (var i=input.length - 1; i > 0; i--)
        {
            var tag = input[i];
            cols[i].checked = tag.checked;
            if (!tag.checked)
            {
                var nextTag = input[i - 1];
                cols[i - 1].checked = nextTag.checked;
                if (nextTag.checked)
                {
                    tag.checked = true;
                    nextTag.checked = false;

                    var temp = cols[i];
                    cols[i] = cols[i - 1];
                    cols[i - 1] = temp;

                    cols[i].checked = true;
                    cols[i - 1].checked = false;
                }
            }
        }

        loadColumns(axis);
    }

    function editColCancel()
    {
        $('#editColumnsModal').modal('hide');
    }

    function editColSave()
    {
        var axis = _columnList.prop('model');
        _columnList.find('input[type=text]').each(function(index, elem)
        {
            axis.columns['@items'][index].value = elem.value;
        });
        $('#editColumnsModal').modal('hide');
        axis.defaultCol = null;
        var result = call("ncubeController.updateAxisColumns", [_selectedCubeName, _selectedApp, _selectedVersion, axis]);

        if (result.status === true)
        {
            loadCube();
        }
        else
        {
            _errorId = showNote("Unable to update columns for axis '" + axis.name + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function editCell(value)
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            _errorId = showNote('No n-cube selected. Cell cannot be updated.');
            return;
        }
        if (_selectedStatus == "RELEASE")
        {
            _errorId = showNote('Only a SNAPSHOT version can be modified.');
            return;
        }

        var result = call("ncubeController.getCellNoExecute", [_selectedCubeName, _selectedApp, _selectedVersion, _selectedStatus, _cellId]);

        if (result.status === false)
        {
            _errorId = showNote('Unable to fetch the cell contents: ' + result.data);
            return;
        }

        var cellInfo = result.data;
        // Set the cell value (String)
        _editCellValue.val(cellInfo.value ? cellInfo.value : "");
        if (cellInfo.dataType == "null" || !cellInfo.dataType)
        {
            cellInfo.dataType = "string";
        }

        // Set the correct entry in the drop-down
        if (cellInfo.isUrl)
        {
            _urlDropdown.val(cellInfo.dataType);
        }
        else
        {
            _valueDropdown.val(cellInfo.dataType);
        }

        // Choose the correct data type drop-down (show/hide the other)
        _urlDropdown.toggle(cellInfo.isUrl);
        _valueDropdown.toggle(!cellInfo.isUrl);

        // Set the URL check box
        _editCellRadioURL.find('input').prop('checked', cellInfo.isUrl);

        // Show/Hide the Cache check box
        _editCellCache.toggle(cellInfo.isUrl && cellInfo.dataType != "exp" && cellInfo.dataType != "model");

        // Set the Cache check box state
        _editCellCache.find('input').prop('checked', cellInfo.isCached);

        _editCellModal.modal('show');
    }

    function editCellClear()
    {
        _editCellModal.modal('hide');
        var result = call("ncubeController.updateCell", [_selectedCubeName, _selectedApp, _selectedVersion, _cellId, null]);

        if (result.status === false)
        {
            _cellId = null;
            _errorId = showNote('Unable to clear cell:<hr class="hr-small"/>' + result.data);
            return;
        }

        _uiCellId.html('');
        _uiCellId.attr({'class':'cell'});
        _cellId = null;
    }

    function editCellCancel()
    {
        _cellId = null;
        _editCellModal.modal('hide');
    }

    function editCellOK()
    {
        var cellInfo = {'@type':'com.cedarsoftware.ncube.CellInfo'};
        cellInfo.isUrl = _editCellRadioURL.find('input').is(':checked');
        cellInfo.value = _editCellValue.val();
        cellInfo.dataType = cellInfo.isUrl ? _urlDropdown.val() : _valueDropdown.val();
        cellInfo.isCached = _editCellCache.find('input').is(':checked');
        _editCellModal.modal('hide');

        var result = call("ncubeController.updateCell", [_selectedCubeName, _selectedApp, _selectedVersion, _cellId, cellInfo]);

        if (result.status === false)
        {
            _cellId = null;
            _errorId = showNote('Unable to update cell:<hr class="hr-small"/>' + result.data);
            return;
        }

        _uiCellId.html(cellInfo.value);
        if (cellInfo.isUrl)
        {
            _uiCellId.attr({'class':'cell cell-url'});
        }
        else if (cellInfo.dataType == "exp" || cellInfo.dataType == "method")
        {
            _uiCellId.attr({'class':'cell cell-code'});
        }
        else
        {
            _uiCellId.attr({'class':'cell'});
        }
        _cellId = null;
    }

    // --------------------------------------------------------------------------------------------
    function buildDropDown(listId, inputId, list, callback)
    {
        var ul = $(listId);
        ul.empty();
        $.each(list, function (key, value)
        {
            var li = $("<li/>");
            var anchor = $('<a href="#"/>');
            anchor.html(value);
            anchor.click(function ()
            {   // User clicked on a dropdown entry, copy its text to input field
                $(inputId).val(anchor.html());
                callback(anchor.html());
            });
            li.append(anchor);
            ul.append(li);
        });
    }

    function doesItemExist(item, list)
    {
        var found = false;
        $.each(list, function (index, value)
        {
            if (item.toLowerCase() === value.toLowerCase())
            {
                found = true;
                return;
            }
        });
        return found;
    }

    function showNote(msg, title)
    {
        return $.gritter.add({
            title: (title || 'Note'),
            text: msg,
            image: './img/cube-logo.png',
            sticky: true
        });
    }

    function clearError()
    {
        if (_errorId)
        {
            $.gritter.remove(_errorId);
            _errorId = null;
        }
    }

    function saveScroll()
    {
        var div = $('#ncubeTabContent');
        var top = div.scrollTop();
        console.log("saveScroll()");
        console.log(top);
        console.log(typeof top);
        localStorage['top'] = top;
    }

    function loadScroll()
    {
        var div = $('#ncubeTabContent');
        console.log("loadScroll()");
        console.log(localStorage['top']);
        console.log(typeof localStorage['top']);
        div.scrollTop(localStorage['top']);
    }

    function getUniqueId()
    {
        return _colIds--;
    }
});
