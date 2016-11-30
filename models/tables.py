# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

import datetime

db.define_table('project',
                Field('project_name', 'text'),
                Field('project_phase', 'text'),
                Field('project_version', 'text'),
                Field('project_owner', 'text'),
                Field('created_on', 'datetime', default=datetime.datetime.utcnow())
                )

db.project.project_name.requires = IS_NOT_EMPTY()
db.project.project_phase.requires = IS_NOT_EMPTY()
db.project.project_version.requires = IS_NOT_EMPTY()

db.define_table('projects_user',
                Field('project_id', 'integer'),
                Field('ardets_username', 'text')
                )

db.projects_user.project_id.requires = IS_NOT_EMPTY();
db.projects_user.ardets_username.requires = IS_NOT_EMPTY();

db.define_table('task',
                Field('project_id', 'integer'),
                Field('priority', 'integer'),
                Field('summary', 'text'),
                Field('project_version', 'text'),
                Field('is_finished', 'boolean'),
                Field('development_track', 'text'),
                Field('task_state', 'text'),
                Field('created_on', 'datetime', default=datetime.datetime.utcnow())
)

db.task.project_id.rqeuires = IS_NOT_EMPTY();
db.task.summary.requires = IS_NOT_EMPTY();
db.task.project_version.requires = IS_NOT_EMPTY();
db.task.is_finished.requires = IS_NOT_EMPTY();
db.task.development_track.requires = IS_NOT_EMPTY();

# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)
