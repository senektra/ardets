import json


@auth.requires_signature()
def get_projects():
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0

    projects = []
    has_more = False
    print start_idx
    q = db.project.project_owner == auth.user_id

    print q
    rows = db(q).select(orderby=db.project.project_name, limitby=(start_idx, end_idx + 1))
    print rows
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            print r.project_name
            p = dict(
                id=r.id,
                project_name=r.project_name,
                project_owner=r.project_owner,
                project_phase=r.project_phase,
                project_version=r.project_version,
                created_on=r.created_on,
                belongs_to_user=True if auth.user_id is not None and auth.user_id == r.project_owner else False
            )
            print auth.user_id
            print r.project_owner
            print "this is dumb"
            projects.append(p)
        else:
            has_more = True

    print projects
    return response.json(dict(
        projects=projects,
        has_more=has_more
    ))


@auth.requires_signature()
def change_task_state():
    new_state = request.vars.new_state
    task_id = request.vars.task_id

    if new_state is "":
        return response.json(dict(state_changed=False))

    task = db.task(task_id)

    task.task_state = new_state

    task.update_record()

    return response.json(dict(
        state_changed=True,
        development_track=task.development_track,
        new_state=task.task_state
    ))


@auth.requires_signature()
def add_task():
    task_summary = request.vars.task_summary
    task_priority = int(request.vars.task_priority)
    task_track = request.vars.task_track

    if task_summary is None:
        return response.json(dict(error="Task cannot be empty"))

    if task_priority > 3 or task_priority < 1:
        return response.json(dict(error="Task priority must be 1, 2, or 3"))

    project_db = db(db.project.id == request.vars.project_id).select().first()
    if project_db is None:
        return response.json(dict(error="Project not a valid project ID"))

    print "here"
    task_id = db.task.insert(
        project_id=project_db.id,
        priority=task_priority,
        summary=task_summary,
        project_version=project_db.project_version,
        is_finished = False,
        development_track=task_track,
        task_state='marked'
    )

    print "then here"
    task = db.task(task_id)

    print "yeah you did"
    return response.json(dict(
        id=task_id,
        project_id=task.project_id,
        priority=task.priority,
        summary=task.summary,
        project_version=task.project_version,
        is_finished=task.is_finished,
        development_track=task.development_track,
        task_state=task.task_state
    ))


@auth.requires_signature()
def delete_task():
    task_id = request.vars.task_id
    delete = request.vars.delete

    if delete == "true":
        task = db.task(task_id)

        if task is None:
            return response.json(dict(deleted=False))

        del db.task[task.id]

        return response.json(dict(
            deleted=True,
            development_track=task.development_track
        ))

    elif delete == "false":
        task = db.task(task_id)

        task.task_state = 'unmarked'
        task.update_record()

        return response.json(dict(
            deleted=False,
            development_track=task.development_track,
            changed_state=True,
            new_state=task.task_state
        ))





@auth.requires_signature()
def get_project():
    if request.vars.project_id is None:
        # No project id given, return empty data.
        return response.json(dict(error="No project ID given"))

    # Check if request.vars.project_id is a valid entry in the database
    project_db = db(db.project.id == request.vars.project_id).select().first()
    if project_db is None:
        # No valid entry in database, return error
        response.json(dict(error="Project ID does not exist"))

    # Auth user

    # Get tasks
    doc_tasks = db((db.task.development_track == "Documentation") &
                   (db.task.project_id == project_db.id)).select(db.task.ALL)
    opt_tasks = db((db.task.development_track == "Optimization") &
                   (db.task.project_id == project_db.id)).select(db.task.ALL)
    fea_tasks = db((db.task.development_track == "Features") &
                   (db.task.project_id == project_db.id)).select(db.task.ALL)
    tes_tasks = db((db.task.development_track == "Testing") &
                   (db.task.project_id == project_db.id)).select(db.task.ALL)

    # If we get here, then a valid ID was given and we have extracted the project from the database.
    return response.json(dict(
        name=project_db.project_name,
        version=project_db.project_version,
        phase=project_db.project_phase,
        doc_tasks=doc_tasks,
        opt_tasks=opt_tasks,
        fea_tasks=fea_tasks,
        tes_tasks=tes_tasks
    ))


@auth.requires_signature()
def create_project():
    project_name = request.vars.project_name
    project_phase = request.vars.project_phase
    project_version_major = int(request.vars.project_version_major)
    project_version_minor = int(request.vars.project_version_minor)
    project_version_patch = int(request.vars.project_version_patch)

    if project_name is "":
        return response.json(dict(error="Project name cannot be empty."))

    if project_phase is "":
        return response.json(dict(error="You must select a project phase."))

    if project_version_major < 0:
        return response.json(dict(error="Version major cannot be negative"))

    if project_version_minor < 0:
        return response.json(dict(error="Version minor cannot be negative"))

    if project_version_patch < 0:
        return response.json(dict(error="Version patch cannot be negative"))

    version_string = "%s.%s.%s" % (project_version_major, project_version_minor, project_version_patch)

    project_check = db(db.project.project_name == project_name).select().first()
    if project_check is not None:
        return response.json(dict(error="Project name is already taken"))

    project_id = db.project.insert(
        project_name = project_name,
        project_owner = auth.user_id,
        project_phase = project_phase,
        project_version = version_string
    )

    project = db.project(project_id)

    return response.json(dict(project=project))