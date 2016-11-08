# -*- coding: utf-8 -*-
# this file is released under public domain and you can use without limitations

# -------------------------------------------------------------------------
# This is a sample controller
# - index is the default action of any application
# - user is required for authentication and authorization
# - download is for downloading files uploaded in the db (does streaming)
# -------------------------------------------------------------------------

import json

def get_user_name_from_email(email):
    """Returns a string corresponding to the user first and last names,
    given the user email."""
    u = db(db.auth_user.email == email).select().first()
    if u is None:
        return 'None'
    else:
        return ' '.join([u.first_name, u.last_name])


def index():
    return dict()


@auth.requires_login()
def edit():
    """
    This is the page to create / edit / delete a post.
    """
    post = None
    post_content = None
    if request.args(0) is None:
        # request.args[0] would give an error if there is no argument 0.
        form_type = 'create'
        # We create a form for adding a new post.  So far, the posts
        # are displayed in very rough form only.
        form = SQLFORM.factory(
            Field('post_content', 'text', label='Content'),
        )
    else:
        # A post is specified via URL.  We need to check that it exists, and that the user is the author.
        # We use .first() to get either the first element or None, rather than an iterator.
        q = ((db.post.user_email == auth.user.email) &
             (db.post.id == request.args(0)))
        post = db(q).select().first()
        if post is None:
            session.flash = T('Not Authorized')
            redirect(URL('default', 'index'))
        # Always write invariants in your code.
        # Here, the invariant is that the post is known to exist.

        # Let's update the last opened date.
        post.updated_on = datetime.datetime.utcnow()
        post.update_record()

        # Is this an edit form?

        is_edit = (request.vars.edit == 'true')
        form_type = 'edit' if is_edit else 'view'

        # Let's extract the posts.
        post_content = post.post_content

        form = SQLFORM.factory(
            Field('post_content', 'text', default=post_content, label='Content',
                  writable=is_edit),
        )

    # Adds some buttons.  Yes, this is essentially glorified GOTO logic.
    button_list = []
    if form_type == 'edit':
        button_list.append(A('Cancel', _class='btn btn-warning',
                             _href=URL('default', 'edit', args=[post.id])))
    elif form_type == 'create':
        button_list.append(A('Cancel', _class='btn btn-warning',
                             _href=URL('default', 'index')))
    elif form_type == 'view':
        button_list.append(A('Edit', _class='btn btn-warning',
                             _href=URL('default', 'edit', args=[post.id], vars=dict(edit='true'))))
        button_list.append(A('Back', _class='btn btn-primary',
                             _href=URL('default', 'index')))
        button_list.append((A('Delete', _class='btn btn-danger',
                              _href=URL('default', 'delete', args=[post.id], user_signature=True))))

    if form.process().accepted:
        # We have to update/insert the record.
        p = form.vars.post_content
        if form_type == 'create':
            db.post.insert(post_content=p)
            session.flash = T('Post added.')
        else:
            session.flash = T('Post edited.')
            post.post_content = p
            post.update_record()
        redirect(URL('default', 'index'))
    elif form.errors:
        session.flash = T('Please enter correct values.')
    return dict(form=form, button_list=button_list, post=post, form_type=form_type,
                post_content=post_content)

@auth.requires_signature()
def delete():
    if request.args(0) is None:
        session.flash = T("No post id in URL for delete")
        redirect(URL('default', 'index'))
    else:
        q = ((db.post.user_email == auth.user.email) &
             (db.post.id == request.args(0)))
        post = db(q).select().first()
        if post is None:
            session.flash = T('Not Authorized')
            redirect(URL('default', 'index'))
        del db.post[post.id]
        session.flash = T('Post deleted')
        redirect(URL('default', 'index'))

def user():
    """
    exposes:
    http://..../[app]/default/user/login
    http://..../[app]/default/user/logout
    http://..../[app]/default/user/register
    http://..../[app]/default/user/profile
    http://..../[app]/default/user/retrieve_password
    http://..../[app]/default/user/change_password
    http://..../[app]/default/user/bulk_register
    use @auth.requires_login()
        @auth.requires_membership('group name')
        @auth.requires_permission('read','table name',record_id)
    to decorate functions that need access control
    also notice there is http://..../[app]/appadmin/manage/auth to allow administrator to manage users
    """
    return dict(form=auth())


@cache.action()
def download():
    """
    allows downloading of uploaded files
    http://..../[app]/default/download/[filename]
    """
    return response.download(request, db)


def call():
    """
    exposes services. for example:
    http://..../[app]/default/call/jsonrpc
    decorate with @services.jsonrpc the functions to expose
    supports xml, json, xmlrpc, jsonrpc, amfrpc, rss, csv
    """
    return service()


