// This is the js for the default/index.html view.

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

    function get_posts_url_with_args(start_idx, end_idx) {
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };

        return get_posts_url + "?" + $.param(pp);
    }

    self.get_more = function() {
        var num_posts = self.vue.posts.length;

        $.getJSON(get_posts_url_with_args(num_posts, num_posts + 4), function(data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.posts, data.posts);
        });
    }

    self.get_posts = function() {
        $.getJSON(get_posts_url_with_args(0, 4), function(data) {
            self.vue.posts = data.posts;
            self.vue.has_more = data.has_more;
            self.vue.user_id = data.user_id > 0 ? true : false;
        });
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

    self.toggle_post_button = function() {
        if (self.vue.user_id) self.vue.is_adding_post = !self.vue.is_adding_post;
    }

    self.toggle_post_under_edit = function(post_id) {
        self.vue.post_being_edited = post_id;
        if (post_id == 0) self.vue.post_under_edit = !self.vue.post_under_edit;
        else self.vue.post_under_edit = true;
    }

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            posts: [],
            is_adding_post: false,
            post_under_edit: false,
            post_being_edited: null,
            user_id: false,
            has_more: false,

            form_content: null
        },
        methods: {
            get_more: self.get_more,
            add_post: self.add_post,
            delete_post: self.delete_post,
            toggle_post_button: self.toggle_post_button,
            toggle_post_under_edit: self.toggle_post_under_edit
        }
    });

    self.get_posts();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
