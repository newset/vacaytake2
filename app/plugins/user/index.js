// Generated by CoffeeScript 1.7.1
(function() {
  var inject_controller;

  define('user', ['require', 'core/analytic'], function(require, analytic) {
    var user_plugin;
    return user_plugin = {
      name: 'user',
      _models: {},
      anchor: '#/user',
      title: 'User',
      type: 'plugin',
      order: -12,
      icon: 'icon-user',
      init: function() {
        var attributes, self;
        self = this;
        attributes = ['pid', 'name', 'role', 'email', 'pic', 'not_first_login', 'initied', 'rated', 'last_login_time'];
        this._models['user'] = {};
        foundry.model(name, attributes, function(model) {
          self._models['user'] = model;
          foundry.initialized(self.name);
        });
      },
      inited: function() {
        var id, self, user, user_model, _ref;
        analytic.init();
        this.check_users();
        self = this;
        user_model = foundry._models['User'];
        _ref = foundry._user_list;
        for (id in _ref) {
          user = _ref[id];
          if (user.id === Nimbus.realtime.c_file.owners[0].permissionId) {
            foundry._current_owner = user;
          }
        }
        return inject_controller();
      },
      check_users: function() {
        var data, one, pid, user, user_model, _i, _len, _ref, _ref1;
        user_model = foundry._models['User'];
        console.log('user list total :' + Object.keys(foundry._user_list).length + ', user model total: ' + user_model.all().length);
        _ref = user_model.all();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          user = _ref[_i];
          if (!user.email) {
            user.destroy();
          }
        }
        _ref1 = foundry._user_list;
        for (pid in _ref1) {
          user = _ref1[pid];
          one = user_model.findByAttribute('pid', pid);
          if (one) {
            if (one.email) {
              user.email = one.email;
              user.roleName = one.role;
            }
          }
          if (one && !one.pic) {
            one.pic = user.pic;
            one.save();
          } else if (!one) {
            data = {
              'pid': pid,
              'name': user.name,
              'pic': user.pic
            };
            if (user.email) {
              data.email = user.email;
            }
            if (Nimbus.realtime.c_file.owners[0].permissionId === pid) {
              data.role = 'Admin';
            } else {
              data.role = 'Viewer';
            }
            if (pid === foundry._current_user.id) {
              data.email = window.user_email;
            }
            user_model.create(data);
            user.roleName = data.role;
          }
          one = user_model.findByAttribute('pid', pid);
          if (pid === foundry._current_user.id) {
            if (!one.not_first_login) {
              one.not_first_login = 1;
              one.save();
            }
          }
        }
      },
      all_user: function() {
        return this._models['user'].all();
      },
      add_user: function(data, callback) {
        var model, user;
        if (!data.role) {
          data.role = 'Viewer';
        }
        model = this._models['user'];
        user = model.findByAttribute('email', data.email);
        if (!user) {
          user = model.create(data);
        }
        user.role = data.role;
        user.save();
        this.add_share(user, function(data) {
          if (callback) {
            return callback(data);
          }
        });
        return analytic.user({
          email: foundry._current_user.email,
          user: data.email,
          id: foundry._current_user.id
        });
      },
      add_share: function(user, callback) {
        var model;
        model = this._models['user'];
        if (user.email) {
          Nimbus.Share.add_share_user_real(user.email, function(u) {
            var t;
            if (u.name) {
              t = model.findByAttribute('email', user.email);
              t.name = u.name;
              t.pid = u.id;
              t.pic = u.pic;
              t.save();
            }
            foundry._user_list[u.id] = {
              name: u.name,
              pic: u.pic,
              roleName: user.role,
              email: user.email,
              id: u.id,
              role: u.role
            };
            if (callback) {
              callback(u);
              return angular.element(document).scope().$apply();
            }
          });
          if (Nimbus.realtime.folder && Nimbus.realtime.folder['binary_files']) {
            return Nimbus.Share.add_share_user_real(user.email, null, Nimbus.realtime.folder['binary_files'].id);
          }
        }
      },
      remove_share: function(user) {
        Nimbus.Share.remove_share_user_real(user.id, function(res) {});
      },
      save_user: function(id, data) {
        var user;
        user = foundry._user_list[id];
        user.roleName = data.role;
        user = this._models['user'].findByAttribute('pid', id);
        if (user) {
          user.role = data.role;
          return user.save();
        }
      },
      del_user: function(user, callback) {
        var id;
        id = user.id;
        this.remove_share(user);
        if (callback) {
          return callback();
        }
      },
      mail_list: function() {
        var i, id, recipients, user, _ref;
        recipients = '';
        i = 0;
        _ref = foundry._user_list;
        for (id in _ref) {
          user = _ref[id];
          if (user.email === foundry._current_user.email) {
            continue;
          }
          if ((foundry.get_setting_all(id, "email") != null) && foundry.get_setting_all(id, "email") === false) {
            continue;
          }
          if (i === 0 && user.email) {
            recipients += user.name + ' <' + user.email + '>';
          } else if (user.email) {
            recipients += ',' + user.name + ' <' + user.email + '>';
          }
          i++;
        }
        return recipients;
      }
    };
  });

  inject_controller = function() {
    return angular.module('foundry').controller('UserListController', [
      '$scope', '$rootScope', '$parse', function($scope, $rootScope, $parse) {
        var current_user, update_current_user_permission, user_model;
        user_model = foundry.load('user');
        $scope.users = foundry._user_list;

        /*
        			basic settings
         */
        $rootScope.shortcut_name = 'Add User';
        current_user = foundry._current_user;
        $scope.user_permission = 'Viewer';
        update_current_user_permission = function() {
          var current_user_in_model;
          current_user_in_model = foundry._models.User.findByAttribute('pid', current_user.id);
          if (current_user_in_model) {
            return $scope.user_permission = current_user_in_model.role;
          }
        };
        update_current_user_permission();
        $scope.add_shortcut = function() {
          $scope.form_mode = 'create';
          $('.form').modal();
        };
        $scope.form_mode = 'create';
        $scope.usermodel = {
          fields: {
            email: {
              type: 'input',
              label: 'Email'
            },
            role: {
              type: 'select',
              label: 'Role',
              options: {
                Admin: 'Admin',
                Viewer: 'Viewer'
              }
            }
          },
          create: 'submit()',
          update: 'update()'
        };
        $scope.userEditModel = {
          fields: {
            role: {
              type: 'select',
              label: 'Role',
              options: {
                Admin: 'Admin',
                Viewer: 'Viewer'
              }
            }
          },
          create: 'submit()',
          update: 'update()'
        };
        $scope.user_data = {
          name: '',
          email: ''
        };

        /*
        			user CURD
         */
        $scope.edit_user = function(id) {
          $scope.form_mode = 'edit';
          $scope.user_data = angular.copy($scope.users[id]);
          $scope.user_data.role = $scope.user_data.roleName;
          $('.update_form').modal();
        };
        $scope.update = function() {
          user_model.save_user($scope.user_data.id, $scope.user_data);
          update_current_user_permission();
          $('.modal').modal('hide');
          $scope.user_data = {};
        };
        $scope.del_user = function(id) {
          user_model.del_user($scope.users[id]);
          return delete foundry._user_list[id];
        };
        $scope.creating_user = false;
        $scope.submit = function() {
          var reset;
          if ($scope.creating_user) {
            return;
          }
          $scope.creating_user = true;
          reset = function() {
            $scope.user_data = {};
            $('.form').modal('hide');
            $('.create_button').removeClass('disabled');
            return $scope.creating_user = false;
          };
          $('.create_button').addClass('disabled');
          user_model.add_user($scope.user_data, function() {
            return reset();
          });
        };
        $scope.user_info = {};
        $scope.show_user = function(id) {
          var user;
          user = $scope.users[id];
          $scope.user_info = {
            'name': user.name,
            'email': user.email
          };
          $('.userinfo').modal();
        };
        $scope.is_owner = function(user) {
          return user.id === foundry._current_owner.id;
        };
        $scope.clear = function() {
          $('.modal').modal('hide');
          $scope.user_data = {};
        };
      }
    ]);
  };

}).call(this);
