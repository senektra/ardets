@auth.requires_login()
def projects():
    if request.args(0) is not None:
        # User wants a specific project page.
        page = request.args(0)

        # Check if the project exists.
        project_db = db(db.project.project_name == page).select().first()

        if project_db is None:
            raise HTTP(404, "Page not found")

        # The dictionary object that gets passed to the view will contain only the project id, the
        # vue.js frontend script will request other needed information via POST on the projects_api
        # controller.
        project = dict(project_id=project_db.id)
        return response.render("user/project.html", project)

    # If no request arguments passed, render user's projects list page.
    return dict()

@auth.requires_login()
def index():
    # Not implemented yet.
    raise HTTP(404, "Page not found")