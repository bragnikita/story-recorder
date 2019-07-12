import React from "react";
import {CategoryObjectsList} from "./list";
import {Category, CategoryChild, Script} from "../../stores/uistore";

const CategoryPage = () => {

    const list = [1,2,3,4,5,6,7,8,9,0,11,12,13,14].map((id) => {
        let item:CategoryChild = new Category();
        if (id === 3) {
            item = new Script();
        }
        item.id = `${id}`;
        item.title = id === 3 ? `Script #${id}` : `Category #${id}`
        return item;
    });


    return <div className="page__CategoryPage">
        <CategoryObjectsList list={list}/>
    </div>
};
export default CategoryPage;