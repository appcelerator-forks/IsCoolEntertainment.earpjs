/*global Titanium,Handlebars,Earp*/
"use strict";

Earp.Generator = function () {};

Earp.Generator.prototype = {

    getOptions: function () {
        var index = 0,
            attributes = this.element.attributes,
            defaults = this.defaults || {},
            attribute = null;
        this.options = {};
        for (attribute in defaults) {
            if (defaults.hasOwnProperty(attribute)) {
                this.options[attribute] = defaults[attribute];
            }
        }
        for (index = 0; index < attributes.getLength(); index += 1) {
            this.addOption(
                attributes.item(index).nodeName,
                attributes.item(index).nodeValue
            );
        }
        return this.options;
    },

    addOption: function (name, value) {
        var aliases = this.aliases || {};
        if (aliases.hasOwnProperty(name)) {
            this.addOption(aliases[name], value);
        } else {
            if (typeof value === 'string' && value.indexOf('{') >= 0) {
                this.options[name] = JSON.parse(value.replace(/\'/g, '"'));
            } else {
                this.options[name] = value;
            }
        }
    },

    proceed: function () {
        var uiObject = this.factory(this.getOptions()),
            index = 0,
            child = {},
            id = this.element.getAttribute('id');
        uiObject.generator = this;
        Earp.feedUIObject(uiObject);
        if (typeof id === 'string' && id.length > 0) {
            this.identityMap[id] = uiObject;
        }
        for (index = 0; index < this.element.childNodes.length; index += 1) {
            if (this.element.childNodes.item(index).hasOwnProperty('tagName')) {
                child = Earp.getGenerator(
                    this.element.childNodes.item(index),
                    this.dom,
                    this.identityMap
                );
                uiObject.add(child.proceed());
            }
        }
        return uiObject;
    },

};

Earp.Generator.extend = function (def) {
    var key = null,
        generator = function (element, dom, identityMap) {
            this.element = element;
            this.dom = dom;
            this.identityMap = identityMap;
        };

    for (key in Earp.Generator.prototype) {
        if (Earp.Generator.prototype.hasOwnProperty(key)) {
            generator.prototype[key] = Earp.Generator.prototype[key];
        }
    }

    for (key in def) {
        if (def.hasOwnProperty(key)) {
            generator.prototype[key] = def[key];
        }
    }

    return generator;
};

Earp.generators = {};

Earp.define = function (name, def) {
    Earp.generators[name] = Earp.Generator.extend(def);
};

Earp.getGenerator = function (element, dom, identityMap) {
    var generator = null;
    if (Earp.generators.hasOwnProperty(element.tagName)) {
        generator = new Earp.generators[element.tagName](
            element,
            dom,
            identityMap
        );
    } else {
        throw 'EarpError: "' + element.tagName + '"' + ' is unknown.';
    }
    return generator;
};
