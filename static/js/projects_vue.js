/**
 * Created by rodolfo on 11/8/16.
 */

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

    function get_projects_url_with_args(start_idx, end_idx) {
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };

        return get_projects_url;
    }

    self.get_more = function() {
        var num_posts = self.vue.posts.length;

        $.getJSON(get_posts_url_with_args(num_posts, num_posts + 4), function(data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.posts, data.posts);
        });
    }

    self.get_projects = function() {
        $.post(get_projects_url, {
            start_idx: 0,
            end_idx: 4
        }, function(data) {
            if (data.projects.length == 0) {
                return
            }

            self.vue.has_projects = true;
            self.vue.projects = data.projects;
        })
    }

    self.add_post = function() {
        var is_edit = self.vue.post_under_edit ? 1 : null;

        var post_id = 0;
        if (is_edit) {
            post_id = self.vue.post_being_edited;
        }

        $.post(add_post_url, {
            form_content: self.vue.form_content,
            post_id: post_id,
            is_edit: is_edit
        }, function(data) {
            $.web2py.enableElement($("#add_post_submit"));
            if (is_edit) {
                post = self.vue.posts.find(function(el) {
                    return el.id == post_id;
                })
                post.post_content = data.post.post_content;
                self.vue.post_under_edit = 0;
                self.vue.post_being_edited = 0;
            } else {
                self.toggle_post_button();
                self.vue.posts.unshift(data.post);
            }
            self.vue.form_content = "";
        });
    }

    self.delete_post = function(post_id) {
        $.post(del_post_url, {
           post_id: post_id
        }, function(data) {
            if (data.deleted) {
                post_idx = self.vue.posts.findIndex(function(el) {
                    return el.id == post_id;
                });
                self.vue.posts.splice(post_idx, 1);
            }
            self.vue.post_being_edited = 0;
            self.vue.post_under_edit = 0;
            self.vue.form_content = "";
        });
    }

    self.create_project = function() {
        $.post(create_project_url, {
            project_name: self.vue.form_project_name,
            project_phase: self.vue.form_project_phase,
            project_version_major: self.vue.form_project_version_major,
            project_version_minor: self.vue.form_project_version_minor,
            project_version_patch: self.vue.form_project_version_patch
        }, function(data) {
            if (data.error) {
                console.log(data);
                $('.help-block').html(data.error);
                $.web2py.enableElement($("#create_project_submit"));
                return;
            }

            if (self.vue.projects == null) {
                self.vue.projects = [];
            }

            self.vue.projects.unshift(data.project);
            self.vue.has_projects = true;
            self.vue.is_creating = false;
        });
    }

    self.toggle_is_creating = function() {
        self.vue.is_creating = !self.vue.is_creating;
        if (self.vue.is_creating) {
            self.vue.form_project_name = "";
            self.vue.form_project_phase = "";
            self.vue.form_project_version_major = 0;
            self.vue.form_project_version_minor = 0;
            self.vue.form_project_version_patch = 0;
        }
    }

    self.send_to_project_page = function(project_name) {
        window.location = base_url + "/" + project_name
    }

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            projects: null,
            is_creating: false,
            has_projects: false,

            // Form Options for Creating a Project
            form_project_name: null,
            form_project_phase: null,
            form_project_version_major: null,
            form_project_version_minor: null,
            form_project_version_patch: null
        },
        methods: {
            toggle_is_creating: self.toggle_is_creating,
            create_project: self.create_project,
            send_to_project_page: self.send_to_project_page
        }
    });

    self.get_projects();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});