# ARDeTS
#### Augmented Rapid Development Tracking System

Version 0.1.0-beta currently running at https://wolfchase.pythonanywhere.com/ardets

### Current Files of Interest

#### Controllers

- user

    Routes all user project based pages to their respective html.
    
- project_api

    All functions used for acquiring user and/or project data via POST request. Most of the
    action happens here. Also a great source for refactoring and optimization.
    
#### Static

- sass/_main.scss

    Contains global CSS properties.
    
- sass/app.scss

    Constants, base and _main are both imported in this file. This file is available on every
    page.
    
- sass/index.scss

    CSS for the index page.

- sass/projects.scss

    Contains CSS for the user's projects landing page.

- sass/project.scss

    CSS for a project's panel page. This is the page where most of the user does their work.

- sass/project_menu.scss

    CSS for the styling of the available menu's found on the projects page.
    
- js/project_vue.js

    Vue information for a project's panel page. Currently the biggest file and really needs a more
    maintable approach, Vuex is considered.
    
- js/projects_vue.js

    Vue information for a user's projects landing page. Mainly used for fetching a users projects
    and creating new ones.
    
- font-awesome-4.7.0

    Font awesome was heavily used to add aesthetics to the web app with icons.
    
#### Views

- default/index.html

    The main landing page for the site. Contains login/logout links.
    
- user/projects.html

    Landing page for user login. Shows user's current projects.
    
- user/project.html

    The page used for displaying a single user project. Currently our largest html file.
    
#### Models

- tables.py

    Contains all tables used to appropriately manage a user's projects. Primarily used were a task
    and project table, with two junction tables, namely projects_user and projects_version.
    
### The Future

I hope that development will continue on even after this project is deemed finished as a 'final project'
for it's intended class CMPS 183 at UCSC. Django is an option I am currently looking into and will most
likely port the project to it. I also intend to clean up the Vue data objects with Vuex to provide a
more maintainable app. 

I'd like to take a moment here to thank **Luca De Alfaro**, my CMPS 183 professor, for making this
project possible through his shared knowledge and passion for the class.
