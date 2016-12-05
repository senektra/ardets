/**
 * Created by rodolfo on 11/8/16.
 */

var DOCUMENTATION = "Documentation";
var FEATURES      = "Features";
var OPTIMIZATION  = "Optimization";
var TESTING       = "Testing";

var MARKED_ICON = 'fa fa-check';
var UNMARKED_ICON = 'fa fa-crosshairs';
var FINISHED_ICON = 'fa fa-rotate-left'

var VERSION_MAJOR = "major";
var VERSION_MINOR = "minor";
var VERSION_PATCH = "patch";

var MAJOR_INC_WARNING = "Incrementing version major will create a new " +
                        "browsable version. Current version will stay as is";

var MINOR_INC_WARNING = "Incrementing version minor will create a new " +
                        "browsable version. Current version will be " +
                        "archived if it hasn't reached production";

var PATCH_INC_VERSION = "Incrementing patch will only alter this version's patch " +
                        "version. It will create a new browsable version.";

var VERSION_MENU_DATA = {
    selected_version_tab: VERSION_MAJOR,
    selected_version_warning: MAJOR_INC_WARNING
};

var SETTINGS_MENU_DATA = {
    selected_settings_tab: "reset",
    button_locked: false
};

var PHASE_MENU_DATA = {
    button_locked: false
};

var tracks = {
    "Documentation": {
        title: DOCUMENTATION,
        faIcon: "fa fa-book fa-3x",
        tasks: []
    },
    "Features": {
        title: FEATURES,
        faIcon: "fa fa-lightbulb-o fa-3x",
        tasks: []
    },
    "Optimization": {
        title: OPTIMIZATION,
        faIcon: "fa fa-level-up fa-3x",
        tasks: []
    },
    "Testing": {
        title: TESTING,
        faIcon: "fa fa-wrench fa-3x",
        tasks: []
    }
}

var getPriority = function(priority) {
    switch(priority) {
        case 'green': return 3;
        case 'yellow': return 2;
        case 'red': return 1;
    }
}

var get_inc_warning = function(version_tab) {
    switch(version_tab) {
        case VERSION_MAJOR: return MAJOR_INC_WARNING;
        case VERSION_MINOR: return MINOR_INC_WARNING;
        case VERSION_PATCH: return PATCH_INC_VERSION;
    }
}

var next_state = function(state) {
    switch(state) {
        case 'marked': return 'finished';
        case 'unmarked': return 'marked';
        case 'finished': return 'unmarked';
    }
}

var spin_load = function(el, fa_icon) {
    $(el).hide();
    $(el).addClass('fa-spin fa-circle-o-notch');
    $(el).removeClass(fa_icon.substring(1));
    $('.fa-spin').show();
}

var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings
    Vue.config.devtools = true;

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    self.get_project = function(version) {
        $.post(get_project_url, {
            project_id: project_id,
            project_version: version
        }, function(data) {
            if (data.error) {
                console.log(data.error);
                return;
            }

            console.log(data);

            self.vue.project.name = data.name;

            self.vue.project.version = data.requested_version;
            self.vue.project.versions = data.versions;
            self.vue.project.versions.unshift(data.version);

            self.vue.project.phase = data.phase;

            self.vue.tracks = tracks;

            self.vue.tracks[DOCUMENTATION].tasks = data.doc_tasks;
            self.vue.tracks[FEATURES].tasks = data.fea_tasks;
            self.vue.tracks[OPTIMIZATION].tasks = data.opt_tasks;
            self.vue.tracks[TESTING].tasks = data.tes_tasks;
        });
    }

    self.get_selected_browse_version = function() {
        return $('#browse-version-select').val();
    }

    self.add_task = function() {
        $.post(add_task_url, {
            project_id: project_id,
            task_summary: self.vue.form_task_summary,
            task_priority: getPriority(self.vue.selected_priority),
            task_track: self.vue.overview_large,
            task_version: self.vue.project.version
        }, function(data) {
            if (data.error) {
                return;
            }

            self.vue.tracks[data.development_track].tasks.unshift(data);

            self.vue.tracks[data.development_track].tasks.sort(function(el1, el2) {
                if (el1.priority < el2.priority) {
                    return -1;
                } else if (el1.priority == el2.priority) {
                    return 0;
                } else {
                    return 1;
                }
            })
        });
    }

    self.set_overview_large = function(track) {
        self.vue.overview_large = track;
    }

    self.is_overview_large = function(track) {
        if (self.vue.overview_large == track) {
            return true;
        } else {
            return false;
        }
    }

    self.is_selected = function(priority) {
        return self.vue.selected_priority == priority;
    }

    self.set_selected_priority = function(priority) {
        self.vue.selected_priority = priority;
    }

    self.get_priority_from_number = function(number) {
        switch(number) {
            case 1: return 'red';
            case 2: return 'yellow';
            case 3: return 'green';
        }
    }

    self.delete_or_unmark_task = function(task_id, task_state) {
        var delete_task = task_state == 'unmarked' ? true : false;
        var fa_icon = task_state == 'unmarked' ? '.fa-close' : '.fa-ban'

        spin_load('#t'+task_id, fa_icon);

        $.post(delete_task_url, {
            task_id: task_id,
            delete: delete_task
        }, function(data) {
            if (!data.deleted) {
                if(!data.changed_state) {
                    return;
                }

                console.log(data);
                task_idx = self.vue.tracks[data.development_track].tasks.findIndex(function(el) {
                    return el.id == task_id;
                });

                self.vue.tracks[data.development_track].tasks[task_idx].task_state = data.new_state;
                return
            }

            task_idx = self.vue.tracks[data.development_track].tasks.findIndex(function(el) {
                return el.id == task_id;
            });

            self.vue.tracks[data.development_track].tasks.splice(task_idx, 1);
        })
    }

    self.set_active_task_state = function(state) {
        self.vue.task_active_state = state;

        switch(state) {
            case 'marked':
                self.vue.task_state_icon = MARKED_ICON;
                break;
            case 'unmarked':
                self.vue.task_state_icon = UNMARKED_ICON;
                break;
            case 'finished':
                self.vue.task_state_icon = FINISHED_ICON;
                break;
        }
    }

    self.activate_state = function(task_id, state) {
        $.post(ch_task_state_url, {
            task_id: task_id,
            new_state: next_state(state)
        }, function(data) {
            if (!data.state_changed) {
                return;
            }

            task_idx = self.vue.tracks[data.development_track].tasks.findIndex(function(el) {
                return el.id == task_id;
            });

            console.log(data);
            self.vue.tracks[data.development_track].tasks[task_idx].task_state = data.new_state;
        })
    }

    self.delete_or_unmark_icon = function(state) {
        if (state == "unmarked") {
            return "fa fa-close";
        } else {
            return "fa fa-ban";
        }
    }

    self.main_bar_select = function(option) {
        switch(option) {
            case 'version':
                self.vue.version_menu_active = !self.vue.version_menu_active;
                self.vue.phase_menu_active = false;
                self.vue.settings_menu_active = false;

                if (self.vue.version_menu_active) {
                    Vue.nextTick(function() {
                        self.lock_increment();
                        $("#browse-version-select").val(self.vue.project.version);
                    });
                }
                break;
            case 'phase':
                self.vue.phase_menu_active = !self.vue.phase_menu_active;
                self.vue.version_menu_active = false;
                self.vue.settings_menu_active = false;

                if (self.vue.phase_menu_active) {
                    Vue.nextTick(self.lock_phase_button);
                }
                break;
            case 'settings':
                self.vue.settings_menu_active = !self.vue.settings_menu_active;
                self.vue.version_menu_active = false;
                self.vue.phase_menu_active = false;

                if (self.vue.settings_menu_active) {
                    Vue.nextTick(self.lock_settings_button);
                }
                break;
        }
    }

    self.set_selected_version_tab = function(version_tab) {
        if (version_tab == self.vue.version_menu_data.selected_version_tab) {
            return;
        }

        self.lock_increment();

        self.vue.version_menu_data.selected_version_tab = version_tab;
        self.vue.version_menu_data.selected_version_warning = get_inc_warning(version_tab);
    }

    self.is_selected_version_tab = function(version_tab) {
        return self.vue.version_menu_data.selected_version_tab == version_tab;
    }

    self.unlock_increment = function() {
        if (self.increment_locked == false) {
            self.lock_increment();
            return;
        }

        $('#increment-form').find('input[type=submit]').prop('disabled', false);
        $('.inc-lock i').removeClass('fa-lock');
        $('.inc-lock i').addClass('fa-unlock');

        self.increment_locked = false;
    }

    self.lock_increment = function() {
        $('#increment-form').find('input[type=submit]').prop('disabled', true);
        $('.inc-lock i').addClass('fa-lock');
        $('.inc-lock i').removeClass('fa-unlock');

        self.increment_locked = true;
    }

    self.increment = function(version) {
        $.post(inc_version_url, {
            project_id: project_id,
            version: version,
            current_version: self.vue.project.version
        }, function(data) {
            $.web2py.enableElement($(".inc-button input"));
            self.lock_increment();

            console.log(data)

            self.vue.project.version = data.version;
            self.vue.project.phase = data.phase;

            if (version == VERSION_PATCH) {
                self.vue.project.versions.shift();
            }

            self.vue.project.versions.unshift(data.version);
        });
    }

    self.is_selected_settings_tab = function(tab) {
        return self.vue.settings_menu_data.selected_settings_tab == tab;
    }

    self.set_selected_settings_tab = function(tab) {
        self.vue.settings_menu_data.selected_settings_tab = tab;
        Vue.nextTick(self.lock_settings_button);
    }

    self.unlock_settings_button = function() {
        if (!self.vue.settings_menu_data.button_locked) {
            self.lock_settings_button();
            return;
        }

        $('.settings-form').find('input[type=submit]').prop('disabled', false);
        $('.settings-button-lock i').addClass('fa-unlock');
        $('.settings-button-lock i').removeClass('fa-lock');

        self.vue.settings_menu_data.button_locked = false;
    }

    self.lock_settings_button = function() {
        $('.settings-form').find('input[type=submit]').prop('disabled', true);
        $('.settings-button-lock i').addClass('fa-lock');
        $('.settings-button-lock i').removeClass('fa-unlock');

        self.vue.settings_menu_data.button_locked = true;
    }

    self.reset_project = function() {
        $.post(reset_project_url, {
            project_id: project_id
        }, function(data) {

            console.log(data);
            if (!data.reset) {
                return;
            }

            console.log(data);

            location.reload();
        })
    }

    self.delete_project = function() {
        $.post(delete_project_url, {
            project_id: project_id
        }, function(data) {
            if (!data.deleted) {
                return;
            }

            window.location.href = data.goto;
        });
    }

    self.unlock_phase_button = function() {
        if (!self.vue.phase_menu_data.button_locked) {
            self.lock_phase_button();
            return;
        }

        $('.phase-form').find('input[type=submit]').prop('disabled', false);
        $('.phase-button-lock i').addClass('fa-unlock');
        $('.phase-button-lock i').removeClass('fa-lock');

        self.vue.phase_menu_data.button_locked = false;
    }

    self.lock_phase_button = function() {
        $('.phase-form').find('input[type=submit]').prop('disabled', true);
        $('.phase-button-lock i').addClass('fa-lock');
        $('.phase-button-lock i').removeClass('fa-unlock');

        self.vue.phase_menu_data.button_locked = true;
    }

    self.get_next_phase = function() {
        switch(self.vue.project.phase) {
            case "Develop":
                return "Staging";
            case "Staging":
                return "Production";
            case "Production":
                return "Archive";
        }
    }

    self.next_project_phase = function() {
        $.post(next_phase_url, {
            project_id: project_id
        }, function(data) {
            if (data.error || data.new_phase == "") {
                console.error("Error bumping phase");
                return;
            }

            $.web2py.enableElement($(".phase-menu-button"));
            self.lock_phase_button();

            self.vue.project.phase = data.new_phase;
        });
    }

    self.init_vue = function() {
        self.vue.selected_priority = 'green';
        self.vue.tracks = tracks;

        self.vue.version_menu_data = VERSION_MENU_DATA;
        self.vue.settings_menu_data = SETTINGS_MENU_DATA;
        self.vue.phase_menu_data = PHASE_MENU_DATA;
    }

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            project: {name:null, version:null, versions:null, phase:null, owner:null},
            overview_large: "",
            tracks: null,
            selected_priority: null,
            task_active_state: 'marked',
            task_state_icon: MARKED_ICON,

            increment_locked: false,

            version_menu_active: false,
            version_menu_data: null,

            phase_menu_active: false,
            phase_menu_data: null,

            settings_menu_active: false,
            settings_menu_data: null,

            // Task Form Models
            form_task_summary: null,
        },
        methods: {
            get_project: self.get_project,
            get_selected_browse_version: self.get_selected_browse_version,

            set_overview_large: self.set_overview_large,
            is_overview_large: self.is_overview_large,

            set_selected_priority: self.set_selected_priority,

            is_selected: self.is_selected,
            add_task: self.add_task,

            delete_or_unmark_task: self.delete_or_unmark_task,
            delete_or_unmark_icon: self.delete_or_unmark_icon,

            get_priority_from_number: self.get_priority_from_number,

            set_active_task_state: self.set_active_task_state,
            activate_state: self.activate_state,

            main_bar_select: self.main_bar_select,

            set_selected_version_tab: self.set_selected_version_tab,
            is_selected_version_tab: self.is_selected_version_tab,

            unlock_increment: self.unlock_increment,
            increment: self.increment,

            is_selected_settings_tab: self.is_selected_settings_tab,
            set_selected_settings_tab: self.set_selected_settings_tab,

            unlock_settings_button: self.unlock_settings_button,

            reset_project: self.reset_project,
            delete_project: self.delete_project,

            unlock_phase_button: self.unlock_phase_button,
            get_next_phase: self.get_next_phase,
            next_project_phase: self.next_project_phase,
        }
    });

    self.init_vue();
    self.get_project("latest");
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});