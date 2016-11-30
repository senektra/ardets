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

    self.get_project = function() {
        $.post(get_project_url, {
            project_id: project_id
        }, function(data) {
            if (data.error) {
                return;
            }

            self.vue.project.name = data.name;
            self.vue.project.version = data.version;
            self.vue.project.phase = data.phase;

            console.log(tracks);

            self.vue.tracks = tracks;

            self.vue.tracks[DOCUMENTATION].tasks = data.doc_tasks;
            self.vue.tracks[FEATURES].tasks = data.fea_tasks;
            self.vue.tracks[OPTIMIZATION].tasks = data.opt_tasks;
            self.vue.tracks[TESTING].tasks = data.tes_tasks;
        });
    }

    self.add_task = function() {
        $.post(add_task_url, {
            project_id: project_id,
            task_summary: self.vue.form_task_summary,
            task_priority: getPriority(self.vue.selected_priority),
            task_track: self.vue.overview_large
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
        Vue.nextTick(function() {
            $('.nano').nanoScroller({ alwaysVisible: true, scroll: 'top' });
        });
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

    self.init_vue = function() {
        self.vue.selected_priority = 'green';
        self.vue.tracks = tracks;
    }
    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            project: {name:null, version:null, phase:null, owner:null},
            overview_large: "",
            tracks: null,
            selected_priority: null,
            task_active_state: 'marked',
            task_state_icon: MARKED_ICON,

            // Task Form Models
            form_task_summary: null,
        },
        methods: {
            set_overview_large: self.set_overview_large,
            is_overview_large: self.is_overview_large,
            set_selected_priority: self.set_selected_priority,
            is_selected: self.is_selected,
            add_task: self.add_task,
            delete_or_unmark_task: self.delete_or_unmark_task,
            delete_or_unmark_icon: self.delete_or_unmark_icon,
            get_priority_from_number: self.get_priority_from_number,
            set_active_task_state: self.set_active_task_state,
            activate_state: self.activate_state
        }
    });

    self.init_vue();
    self.get_project();
    $("#vue-div").show();
    $(".nano").nanoScroller();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});