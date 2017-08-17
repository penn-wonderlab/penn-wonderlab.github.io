---
layout: default
title: Research Projects
---

We share an interest in advancing learning that is <i>collaborative</i>, <i>connected</i>, <i>connective</i>, and <i>collective</i>. To this end, we design innovative digital learning environments, develop analytic applications, and conduct collaborative research in various learning contexts.

### Active Projects

<div class="card-columns">
{% for p in site.projects %}
{% if p.status != "inactive" %}
<div class="card {%if p.link or p.url%}link{%endif%}">
    {% if p.link %}
        {% assign proj_url = p.link %}
    {% else %}
        {% capture proj_url %}{{site.base}}{{p.url}}.html{% endcapture %}
    {% endif %}

    <a href="{{proj_url}}">
        <div class="card-block">
            <div class="title">
                {% if p.image %}
                    {% assign imgurl = p.image %}
                    {% capture init %}{{ p.image | slice: 0,1 }}{% endcapture %}
                    {% if init == "/" %}
                        {% capture imgurl %}{{site.base}}{{p.image}}{% endcapture %}
                    {% endif %}
                    <h3 class="card-title">
                        <img class="icon img-responsive" src="{{imgurl}}" alt="{{p.title}}"/>
                    </h3>
                {% endif %}                
                <h3 class="card-title">{{p.title}}</h3>
            </div>
            <div class="card-text">
                {{ p.description | markdownify }}
            </div>
        </div>
        {% if p.people %}
        <div class="card-footer">
            {% include project-people.html people=p.people %}
        </div>
        {% endif %}
    </a>
</div>
{% endif %}
{% endfor %}
</div>

### Completed Projects

<div class="card-columns">
{% for p in site.projects %}
{% if p.status == "inactive" %}
<div class="card {%if p.link or p.url%}link{%endif%}">
    {% if p.link %}
        {% assign proj_url = p.link %}
    {% else %}
        {% capture proj_url %}{{site.base}}{{p.url}}.html{% endcapture %}
    {% endif %}

    <a href="{{proj_url}}">
        <div class="card-block">
            <div class="title">
                {% if p.image %}
                    {% assign imgurl = p.image %}
                    {% capture init %}{{ p.image | slice: 0,1 }}{% endcapture %}
                    {% if init == "/" %}
                        {% capture imgurl %}{{site.base}}{{p.image}}{% endcapture %}
                    {% endif %}
                    <h3 class="card-title">
                        <img class="icon img-responsive" src="{{imgurl}}" alt="{{p.title}}"/>
                    </h3>
                {% endif %}                
                <h3 class="card-title">{{p.title}}</h3>
            </div>
            <div class="card-text">
                {{ p.description | markdownify }}
            </div>
        </div>
        {% if p.people %}
        <div class="card-footer">
            {% include project-people.html people=p.people %}
        </div>
        {% endif %}
    </a>
</div>
{% endif %}
{% endfor %}
</div>
