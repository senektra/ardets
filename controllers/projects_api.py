import json


@auth.requires_signature()
def get_projects():
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0

    projects = []
    has_more = False
    q = db.project.project_owner == auth.user_id

    rows = db(q).select(orderby=db.project.project_name, limitby=(start_idx, end_idx + 1))
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            p = dict(
                id=r.id,
                project_name=r.project_name,
                project_owner=r.project_owner,
                project_phase=r.project_phase,
                project_version=r.project_version,
                created_on=r.created_on,
                belongs_to_user=True if auth.user_id is not None and auth.user_id == r.project_owner else False
            )
            projects.append(p)
        else:
            has_more = True

    return response.json(dict(
        projects=projects,
        has_more=has_more
    ))

@auth.requires_signature()
def increment_version():
    project_id = request.vars.project_id
    version_to_increment = request.vars.version

    project_db = db.project(project_id)

    if project_db is None:
        return response.json(dict(
            error="Generic error number 1"
        ))

    old_version = project_db.project_version
    version_numbers = old_version.split('.')

    version_major_number = int(version_numbers[0])
    version_minor_number = int(version_numbers[1])
    version_patch_number = int(version_numbers[2])

    if version_to_increment == "major":
        version_major_number += 1
        version_minor_number = 0
        version_patch_number = 0

    if version_to_increment == "minor":
        version_minor_number += 1
        version_patch_number = 0

        if project_db.project_phase != "Production":
            project_db.project_phase = "Archive"

    if version_to_increment == "patch":
        version_patch_number += 1

    version_string = "%i.%i.%i" % (version_major_number, version_minor_number, version_patch_number)

    project_db.project_version = version_string

    proj_ver_db = None
    if version_to_increment != "patch":
        proj_ver_id = db.projects_version.insert(
            project_id=project_db.id,
            project_version=old_version
        )

        proj_ver_db = db.projects_version(proj_ver_id)
    else:
        # This code is broken
        proj_ver_db = db(db.projects_version.project_version == old_version).select().first()
        proj_ver_db.project_version = version_string
        proj_ver_db.update_record()

    project_db.update_record()

    return response.json(dict(
        project_id=project_id,
        proj_ver=proj_ver_db.project_version if proj_ver_db is not None else None,
        version=version_string
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
    task_version = request.vars.task_version

    if task_summary is None:
        return response.json(dict(error="Task cannot be empty"))

    if task_priority > 3 or task_priority < 1:
        return response.json(dict(error="Task priority must be 1, 2, or 3"))

    project_db = db(db.project.id == request.vars.project_id).select().first()
    if project_db is None:
        return response.json(dict(error="Project not a valid project ID"))

    task_id = db.task.insert(
        project_id=project_db.id,
        priority=task_priority,
        summary=task_summary,
        project_version=project_db.project_version,
        is_finished = False,
        development_track=task_track,
        task_state='marked'
    )

    task = db.task(task_id)

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
    version = request.vars.project_version

    if request.vars.project_id is None:
        # No project id given, return empty data.
        return response.json(dict(error="No project ID given"))

    # Check if request.vars.project_id is a valid entry in the database
    project_db = db(db.project.id == request.vars.project_id).select().first()
    if project_db is None:
        # No valid entry in database, return error
        response.json(dict(error="Project ID does not exist"))

    # Auth user

    # Set version for tasks
    task_version = project_db.project_version if version == "latest" else version

    # Get tasks
    doc_tasks = db((db.task.development_track == "Documentation") &
                   (db.task.project_id == project_db.id) & (db.task.project_version == task_version)).select(db.task.ALL)
    opt_tasks = db((db.task.development_track == "Optimization") &
                   (db.task.project_id == project_db.id) & (db.task.project_version == task_version)).select(db.task.ALL)
    fea_tasks = db((db.task.development_track == "Features") &
                   (db.task.project_id == project_db.id) & (db.task.project_version == task_version)).select(db.task.ALL)
    tes_tasks = db((db.task.development_track == "Testing") &
                   (db.task.project_id == project_db.id) & (db.task.project_version == task_version)).select(db.task.ALL)

    # Get versions

    # Prepare the query
    q = db.projects_version.project_id == request.vars.project_id

    # Get the information
    versions_db = db(q).select(db.projects_version.ALL)

    print versions_db

    # Pack the information
    versions = []
    for i, proj_ver in enumerate(versions_db):
        versions.insert(0, proj_ver.project_version)

    # If we get here, then a valid ID was given and we have extracted the project from the database.
    return response.json(dict(
        name=project_db.project_name,
        version=project_db.project_version,
        versions=versions,
        requested_version=task_version,
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

@auth.requires_signature()
def reset_project():
    project_id = request.vars.project_id

    if project_id is None:
        return response.json(dict(error="No project ID given", reset=False))

    project_db = db.project(project_id)

    project_db.project_phase = "Develop"
    project_db.project_version = "0.1.0"

    tasks = db(db.task.project_id == project_id).select(db.task.ALL)
    print tasks
    for task in tasks:
        del db.task[task.id]

    versions = db(db.projects_version.project_id == project_id).select(db.projects_version.ALL)
    print versions
    for version in versions:
        del db.projects_version[version.id]

    project_db.update_record()

    return response.json(dict(reset=True))

@auth.requires_signature()
def dev_reset_project():
    pass

@auth.requires_signature()
def delete_project():
    pass